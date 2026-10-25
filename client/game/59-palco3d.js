/* ===================== v8: o PALCO 3D (Three.js r149) =====================
   alciana: "queria q as coisas fossem 3d bonito nao pixelado".
   Um WebGLRenderer só (canvas fixo atrás do HUD) desenha o cenário da arena em 3D (chão com manchas de terreno,
   milharal, pomar, brejo, pasto, clareira da briga no meio, celeiro, silo, moinho, árvores, cercas, lagoa, lanternas,
   fogueira, céu e neblina) e os PERSONAGENS 3D (window.CHAR3D[id](THREE,KIT3D), ver MODELOS3D.md).
   Como tudo se encaixa no jogo que já existe:
   - O DOM continua o mesmo (lanes = <button> invisíveis, .card.unit com data-id/data-uid, números e selos em HTML).
     A câmera é montada a partir da posição REAL dos lugares (.chao de cada lane): cada ponto da tela vira um ponto
     do chão (raio da câmera ∩ plano y=0), então os modelos ficam exatamente em cima dos botões e dos números.
   - A coreografia (35-fx.js) continua animando o DOM com WAAPI: .fig (o caminho no chão: corrida, empurrão, pulo da
     Guarda), canvas.spr (pulinhos, estica-e-puxa, tombo da morte, brilho) e a opacidade. A cada quadro o palco 3D LÊ
     essas transformações e move o modelo: deslocamento da .fig = andar no chão; translateY do canvas = altura do pulo;
     rotate = tombo; brightness/drop-shadow = brilho do material. O estado do desenho (sprAcao: atk/hit/entra, sono)
     vira anim(st,t,p) do modelo. Assim a ordem dos eventos e os tempos não mudam.
   - Sem WebGL (ou se o contexto cair) volta para o cenário 2D v7 (58-palco.js + sprites).
   Um laço só (requestAnimationFrame), pausa com a aba escondida e fora da batalha; ao sair, tudo é descartado
   (o renderer fica guardado para a próxima partida: abrir/fechar não cria contextos novos). */
const P3D={on:false,falhou:false,r:null,cv:null,scene:null,cam:null,raf:0,t0:0,last:0,G:null,gk:'',chk:0,mk:'',
  units:new Map(),spots:[],mundo:null,amb:[],fx:[],uT:{value:0},luzFx:null,sol:null,hemi:null,arena:1,frames:0,lento:0,qual:0,
  ray:null,plano:null,v1:null,v2:null,ndc:null,partS:null,partG:null,parts:[],texs:{},sombraPar:0,flashT:0,raioT:0};
const P3D_RAR={comum:'#E8E2D0',incomum:'#7FE07F',rara:'#5FB0FF',epica:'#C88BFF',lendaria:'#FFD35A'};
function p3dTemWebGL(){
  if(P3D.falhou||typeof window.THREE==='undefined')return false;
  try{const c=document.createElement('canvas');return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));}catch(e){return false;}
}
function p3dCelular(){try{return matchMedia('(pointer:coarse)').matches||Math.min(window.innerWidth,window.innerHeight)<600;}catch(e){return window.innerWidth<700;}}
/* ---------- abrir / fechar ---------- */
function p3dIniciar(bt){
  if(!bt||!p3dTemWebGL())return false;
  const T=window.THREE;
  try{
    if(!P3D.r){
      if(T.ColorManagement&&'legacyMode' in T.ColorManagement)T.ColorManagement.legacyMode=false;
      const cv=document.createElement('canvas');cv.className='b3dcv';cv.setAttribute('aria-hidden','true');
      const r=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
      if(!r.getContext())throw new Error('sem contexto');
      r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.18;
      r.shadowMap.enabled=false; // v11: sem mapa de sombras (era a metade do peso); cada personagem tem a sua sombra redonda
      r.debug.checkShaderErrors=false;
      cv.addEventListener('webglcontextlost',e=>{e.preventDefault();p3dFalhar();},false);
      // WebGL por software (sem placa de vídeo): começa na qualidade mais leve
      try{const gl=r.getContext(),di=gl.getExtension('WEBGL_debug_renderer_info');P3D.soft=!!(di&&/swiftshader|llvmpipe|software|softpipe/i.test(gl.getParameter(di.UNMASKED_RENDERER_WEBGL)||''));}catch(e){P3D.soft=false;}
      P3D.r=r;P3D.cv=cv;p3dPosIniciar();
      P3D.ray=new T.Raycaster();P3D.plano=new T.Plane(new T.Vector3(0,1,0),0);P3D.v1=new T.Vector3();P3D.v2=new T.Vector3();P3D.ndc=new T.Vector2();
    }
    P3D.qual=(P3D.soft&&!window.__P3DQ)?2:0;P3D.lento=0;
    P3D.r.setPixelRatio(p3dPR());
    bt.insertBefore(P3D.cv,bt.firstChild);
    P3D.scene=new T.Scene();
    P3D.cam=new T.PerspectiveCamera(40,1,0.1,400);
    P3D.on=true;P3D.G=null;P3D.gk='';P3D.mk='';P3D.vk=undefined;P3D.def=null;P3D.defK='';P3D.t0=performance.now();P3D.last=0;P3D.frames=0;
    bt.classList.add('b3d');
    p3dKick();
    return true;
  }catch(e){P3D.falhou=true;P3D.on=false;try{if(P3D.cv&&P3D.cv.parentNode)P3D.cv.remove();}catch(_){}return false;}
}
function p3dPR(){const d=window.devicePixelRatio||1;const cel=p3dCelular();const tetos=cel?[1.25,1.1,1]:[1.5,1.25,1];return Math.min(d,tetos[Math.min(P3D.qual,2)]);}
/* ---------- v9: contorno de desenho animado (pós-processo pela profundidade) ----------
   A cena vai para um alvo de render (meia-precisão, MSAA 4x no WebGL2) com textura de profundidade; um triângulo de tela
   cheia copia a cor e escurece onde a profundidade "quebra" (laplaciano de 1/z: zero em superfícies planas, então o chão
   inclinado não ganha risco; só as silhuetas e as quinas fortes). Custa 1 chamada de desenho e 9 leituras por pixel.
   Sem WebGL2/float: desenha direto, sem contorno. window.__P3DSEMLINHA desliga (para comparar). */
function p3dPosIniciar(){
  const T=window.THREE,r=P3D.r;P3D.pos=null;
  try{
    if(!window.__P3DLINHA||!r.capabilities.isWebGL2)return; // v11: desligado (pesava no celular e no Mac de tela retina)const gl=r.getContext();
    if(!gl.getExtension('EXT_color_buffer_float')&&!gl.getExtension('EXT_color_buffer_half_float'))return;
    const mat=new T.ShaderMaterial({uniforms:{tC:{value:null},tD:{value:null},px:{value:new T.Vector2(1e-3,1e-3)},cn:{value:1},cf:{value:100},lc:{value:new T.Color('#2A1830')},forca:{value:1},longe:{value:new T.Vector2(30,120)},dois:{value:1}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:`uniform sampler2D tC;uniform sampler2D tD;uniform vec2 px;uniform float cn;uniform float cf;uniform vec3 lc;uniform float forca;uniform vec2 longe;uniform float dois;varying vec2 vUv;
        float iz(vec2 o){float d=texture2D(tD,vUv+o*px).x;return (cf-(cf-cn)*d)/(cn*cf);}
        float borda(float k,float z0,out float m){
          float l=iz(vec2(-k,0.0)),r=iz(vec2(k,0.0)),u=iz(vec2(0.0,k)),d=iz(vec2(0.0,-k));float q=k*0.7071;
          float a=iz(vec2(-q,q)),b=iz(vec2(q,-q)),e=iz(vec2(q,q)),f=iz(vec2(-q,-q));
          m=max(max(max(l,r),max(u,d)),max(max(max(a,b),max(e,f)),z0));
          float lap=max(max(abs(l+r-2.0*z0),abs(u+d-2.0*z0)),max(abs(a+b-2.0*z0),abs(e+f-2.0*z0)))/max(m,1e-6);
          return smoothstep(0.016,0.05,lap);}
        void main(){vec4 c=texture2D(tC,vUv);
          float z0=iz(vec2(0.0)),m,m2;
          float ed=borda(1.0,z0,m);
          if(dois>0.5)ed=ed*0.55+borda(0.5,z0,m2)*0.45;
          ed*=mix(1.0,0.35,smoothstep(longe.x,longe.y,1.0/max(m,1e-6)));
          c.rgb=mix(c.rgb,lc,ed*forca);
          gl_FragColor=vec4(c.rgb,1.0);
          #include <encodings_fragment>
        }`,depthTest:false,depthWrite:false,toneMapped:false});
    const q=new T.Mesh(new T.PlaneGeometry(2,2),mat);q.frustumCulled=false;const sc=new T.Scene();sc.add(q);
    P3D.pos={mat,sc,cam:new T.OrthographicCamera(-1,1,1,-1,0,1),rt:null,amostras:-1,w:0,h:0};
  }catch(e){P3D.pos=null;}
}
function p3dPosTam(){
  const T=window.THREE,P=P3D.pos;if(!P||!P3D.r)return;
  const v=P3D.r.getDrawingBufferSize(new T.Vector2());const w=Math.max(1,Math.floor(v.x)),h=Math.max(1,Math.floor(v.y));const am=P3D.qual>=2?0:4;
  if(!P.rt||P.amostras!==am){if(P.rt){P.rt.depthTexture&&P.rt.depthTexture.dispose();P.rt.dispose();}
    const rt=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,samples:am,depthBuffer:true,stencilBuffer:false});rt.texture.generateMipmaps=false;
    rt.depthTexture=new T.DepthTexture(w,h,T.UnsignedIntType);P.rt=rt;P.amostras=am;P.w=P.h=0;}
  if(P.w!==w||P.h!==h){P.rt.setSize(w,h);P.w=w;P.h=h;}
  const k=Math.max(1.7,(P3D.r.getPixelRatio()||1)*1.35);P.mat.uniforms.px.value.set(k/w,k/h);P.mat.uniforms.dois.value=P3D.qual>=2?0:1;
  P.mat.uniforms.tC.value=P.rt.texture;P.mat.uniforms.tD.value=P.rt.depthTexture;
}
function p3dRender(){
  const r=P3D.r,P=P3D.pos;
  r.info.autoReset=false;r.info.reset();
  if(P&&P.rt){
    try{const A=p3dArenaDef();const u=P.mat.uniforms;u.cn.value=P3D.cam.near;u.cf.value=P3D.cam.far;if(P.lk!==A.linha){u.lc.value.set(A.linha);P.lk=A.linha;}
      u.longe.value.set(P3D.G.D*2.2,P3D.G.D*7);
      r.setRenderTarget(P.rt);r.render(P3D.scene,P3D.cam);r.setRenderTarget(null);r.render(P.sc,P.cam);return;}
    catch(e){try{r.setRenderTarget(null);}catch(_){}P3D.pos=null;}
  }
  r.render(P3D.scene,P3D.cam);
}
function p3dPosDescartar(){const P=P3D.pos;if(!P)return;try{if(P.rt){P.rt.depthTexture&&P.rt.depthTexture.dispose();P.rt.dispose();}P.mat.dispose();P.sc.children[0].geometry.dispose();}catch(e){}P3D.pos=null;}
function p3dParar(){
  if(P3D.raf)cancelAnimationFrame(P3D.raf);P3D.raf=0;
  if(!P3D.on&&!P3D.scene)return;
  P3D.on=false;
  for(const U of P3D.units.values())p3dTirarUnidade(U,true);P3D.units.clear();
  if(P3D.scene)p3dDescartar(P3D.scene);
  P3D.scene=null;P3D.mundo=null;P3D.amb=[];P3D.fx=[];P3D.spots=[];P3D.parts=[];P3D.partS=null;P3D.partG=null;P3D.luzFx=null;P3D.sol=null;P3D.hemi=null;P3D.L=null;P3D.herois=[];
  for(const k in P3D.texs){try{P3D.texs[k].dispose();}catch(e){}}P3D.texs={};
  try{if(P3D.r)P3D.r.renderLists.dispose();}catch(e){}
  if(P3D.cv&&P3D.cv.parentNode)P3D.cv.remove();
  const bt=document.getElementById('battle');if(bt)bt.classList.remove('b3d');
}
function p3dDescartar(o){
  o.traverse(m=>{
    if(m.geometry)try{m.geometry.dispose();}catch(e){}
    if(m.material){const ms=Array.isArray(m.material)?m.material:[m.material];for(const x of ms){try{for(const k of ['map','emissiveMap','alphaMap','gradientMap'])if(x[k]&&!x[k].userData.p3dComp)x[k].dispose();x.dispose();}catch(e){}}}
  });
}
/* o contexto caiu (ou o WebGL falhou no meio): volta para o tabuleiro 2D v7 */
function p3dFalhar(){
  P3D.falhou=true;
  const estava=P3D.on;
  try{p3dParar();}catch(e){}
  try{p3dPosDescartar();if(P3D.r)P3D.r.dispose();}catch(e){}
  P3D.r=null;P3D.cv=null;
  if(estava&&typeof B!=='undefined'&&B&&typeof inBattle!=='undefined'&&inBattle){
    const bt=document.getElementById('battle');if(bt)bt.classList.remove('b3d');
    try{BU.bm=null;aplicarModo();palcoIniciar(document.getElementById('bCena'));medirPersonagem();for(const E of SPR.u.values())sprDesenhar(E,performance.now());sprKick();bRender();}catch(e){}
  }
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)p3dKick();});
window.addEventListener('resize',()=>{if(P3D.on){P3D.gk='';p3dKick();}});
function p3dKick(){if(P3D.raf||!P3D.on||document.hidden)return;P3D.raf=requestAnimationFrame(p3dLoop);}

/* ---------- utilidades ---------- */
const p3dH=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
function p3dRuido(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
  const a=p3dH(xi,zi),b=p3dH(xi+1,zi),c=p3dH(xi,zi+1),d=p3dH(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
const p3dFbm=(x,z)=>p3dRuido(x,z)*0.5+p3dRuido(x*2.13+7.1,z*2.13+3.3)*0.3+p3dRuido(x*4.37+1.7,z*4.37+9.2)*0.2;
function p3dRng(seed){let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const p3dSm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function p3dCor(h){return new THREE.Color(h);}
function p3dMat(cor,o){o=o||{};const m=new THREE.MeshStandardMaterial({color:cor,roughness:o.rough==null?0.78:o.rough,metalness:o.metal||0,flatShading:!!o.flat});
  if(o.emi){m.emissive=new THREE.Color(o.emi);m.emissiveIntensity=o.ei==null?1:o.ei;}if(o.vc)m.vertexColors=true;if(o.map)m.map=o.map;
  return o.liso?m:p3dToon(m);}
/* v9: luz de desenho animado em 3 tons. Troca só a luz direta do MeshStandardMaterial (o objeto do material continua o
   mesmo: os anim() dos modelos que mexem em emissive/opacity/cor seguem funcionando, e o brilho dos golpes também).
   Metais (coroas) ficam como estão. A sombra do sol continua (já vem dentro de directLight.color). */
const P3D_TOON_GLSL=`
void RE_Direct_Toon9(const in IncidentLight directLight,const in GeometricContext geometry,const in PhysicalMaterial material,inout ReflectedLight reflectedLight){
  float dNL=saturate(dot(geometry.normal,directLight.direction));
  float s=mix(0.40,0.74,smoothstep(0.05,0.12,dNL));s=mix(s,1.0,smoothstep(0.36,0.44,dNL));
  reflectedLight.directDiffuse+=s*directLight.color*BRDF_Lambert(material.diffuseColor);
  float rim=pow(1.0-saturate(dot(geometry.normal,geometry.viewDir)),3.0);
  reflectedLight.directDiffuse+=smoothstep(0.55,0.62,rim)*s*0.18*directLight.color*material.diffuseColor;
}
#undef RE_Direct
#define RE_Direct RE_Direct_Toon9
`;
const P3D_T9=new WeakSet();
function p3dToon(mat){
  if(!mat||!mat.isMeshStandardMaterial||P3D_T9.has(mat)||(mat.metalness||0)>0.35)return mat;
  P3D_T9.add(mat);
  const prev=mat.hasOwnProperty('onBeforeCompile')?mat.onBeforeCompile:null,pk=mat.hasOwnProperty('customProgramCacheKey')?mat.customProgramCacheKey:null;
  mat.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);sh.fragmentShader=sh.fragmentShader.replace('#include <lights_physical_pars_fragment>','#include <lights_physical_pars_fragment>\n'+P3D_TOON_GLSL);};
  mat.customProgramCacheKey=function(){return 't9|'+(pk?pk.call(this):'');};
  mat.needsUpdate=true;return mat;
}
function p3dToonTudo(root){root.traverse(m=>{if(!m.isMesh||!m.material)return;for(const x of (Array.isArray(m.material)?m.material:[m.material]))p3dToon(x);});}
/* junta geometrias (com índice ou sem) numa só: posição + normal (+ cor opcional por peça) */
function p3dJuntar(list){
  let nv=0,ni=0;const ps=[];
  for(const it of list){let g=it.g||it;if(g.index)g=g.toNonIndexed();if(it.m){g=g.clone();g.applyMatrix4(it.m);}if(!g.attributes.normal)g.computeVertexNormals();ps.push({g,c:it.c?new THREE.Color(it.c):null});nv+=g.attributes.position.count;}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),col=new Float32Array(nv*3);let o=0,temCor=false;
  for(const {g,c} of ps){const p=g.attributes.position.array,n=g.attributes.normal.array;pos.set(p,o*3);nor.set(n,o*3);
    const cnt=g.attributes.position.count;for(let i=0;i<cnt;i++){col[(o+i)*3]=c?c.r:1;col[(o+i)*3+1]=c?c.g:1;col[(o+i)*3+2]=c?c.b:1;}if(c)temCor=true;o+=cnt;}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(pos,3));G.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  if(temCor)G.setAttribute('color',new THREE.BufferAttribute(col,3));
  return G;
}
function p3dM4(x,y,z,rx,ry,rz,sx,sy,sz){const m=new THREE.Matrix4();m.compose(new THREE.Vector3(x||0,y||0,z||0),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0,ry||0,rz||0)),new THREE.Vector3(sx==null?1:sx,sy==null?(sx==null?1:sx):sy,sz==null?(sx==null?1:sx):sz));return m;}
/* balanço do vento (capim, milho, copas): injeta no vertex shader, usa a posição da instância como fase */
function p3dBalanco(mat,amp,modo){
  const prev=mat.hasOwnProperty('onBeforeCompile')?mat.onBeforeCompile:null,pk=mat.hasOwnProperty('customProgramCacheKey')?mat.customProgramCacheKey:null;
  mat.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);sh.uniforms.uT=P3D.uT;
    sh.vertexShader='uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 ipw=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
      #else
        vec3 ipw=${modo==='vert'?'vec3(floor(position.x*3.0),0.0,floor(position.z*3.0))*0.33':'vec3(modelMatrix[3][0],0.0,modelMatrix[3][2])'};
      #endif
      float swv=sin(uT*1.6+ipw.x*0.8+ipw.z*0.55)*0.6+sin(uT*2.7+ipw.x*1.9-ipw.z*0.4)*0.3;
      float hgt=${modo==='copa'?'1.0':'max(0.0,position.y)'};
      transformed.x+=swv*${amp.toFixed(3)}*hgt;transformed.z+=swv*${(amp*0.4).toFixed(3)}*hgt;`);};
  mat.customProgramCacheKey=function(){return 'bal'+amp+(modo||'')+'|'+(pk?pk.call(this):'');};mat.needsUpdate=true;
  return mat;
}
/* texturas pintadas em canvas (brilho redondo, anel, runa, feixe) */
function p3dTex(nome){
  if(P3D.texs[nome])return P3D.texs[nome];
  const S=128,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  if(nome==='brilho'){const gr=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.25,'rgba(255,255,255,.75)');gr.addColorStop(0.6,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);}
  else if(nome==='anel'){const gr=g.createRadialGradient(S/2,S/2,S*0.28,S/2,S/2,S/2);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(0.55,'rgba(255,255,255,.95)');gr.addColorStop(0.72,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);
    const g2=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S*0.4);g2.addColorStop(0,'rgba(255,255,255,.28)');g2.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=g2;g.fillRect(0,0,S,S);}
  else if(nome==='runa'){g.strokeStyle='#FFFFFF';g.lineWidth=3;g.beginPath();g.arc(S/2,S/2,S*0.46,0,6.283);g.stroke();g.lineWidth=2;g.beginPath();g.arc(S/2,S/2,S*0.36,0,6.283);g.stroke();
    for(let i=0;i<12;i++){const a=i/12*6.283;g.save();g.translate(S/2+Math.cos(a)*S*0.41,S/2+Math.sin(a)*S*0.41);g.rotate(a);g.fillStyle='#FFFFFF';g.fillRect(-3,-2,6,4);g.restore();}
    g.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283-1.57;g.lineTo(S/2+Math.cos(a)*S*0.34,S/2+Math.sin(a)*S*0.34);}g.closePath();g.stroke();
    g.beginPath();for(let i=0;i<3;i++){const a=i/3*6.283-1.57;g.lineTo(S/2+Math.cos(a)*S*0.34,S/2+Math.sin(a)*S*0.34);}g.closePath();g.stroke();
    g.beginPath();for(let i=0;i<3;i++){const a=i/3*6.283+1.57;g.lineTo(S/2+Math.cos(a)*S*0.34,S/2+Math.sin(a)*S*0.34);}g.closePath();g.stroke();}
  else if(nome==='feixe'){const gr=g.createLinearGradient(0,S,0,0);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.5,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);
    for(let i=0;i<6;i++){g.fillStyle='rgba(255,255,255,.25)';g.fillRect(i*S/6+4,0,3,S);}}
  else if(nome==='tracejado'){g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=5;g.setLineDash([11,9]);g.beginPath();g.arc(S/2,S/2,S*0.44,0,6.283);g.stroke();
    const gr=g.createRadialGradient(S/2,S/2,0,S/2,S/2,S*0.44);gr.addColorStop(0,'rgba(255,255,255,.28)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,S,S);}
  const t=new THREE.CanvasTexture(c);t.userData.p3dComp=true;P3D.texs[nome]=t;return t;
}

/* ---------- câmera: monta a partir dos lugares reais do DOM ---------- */
function p3dChave(){
  const bt=document.getElementById('battle'),cp=document.getElementById('bCampo'),a=document.getElementById('ln-p-0'),b=document.getElementById('ln-r-3');
  if(!bt||!cp||!a||!b)return '';
  const rc=cp.getBoundingClientRect(),ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(),st=bt.scrollTop;
  return [bt.clientWidth,bt.clientHeight,Math.round(rc.left),Math.round(rc.width),Math.round(ra.bottom+st),Math.round(ra.left),Math.round(rb.bottom+st),Math.round(rb.right),B?B.arena:0].join(',');
}
function p3dTela(P){const v=P3D.v2.copy(P).project(P3D.cam);return {x:(v.x+1)/2*P3D.G.W,y:(1-v.y)/2*P3D.G.H};}
function p3dChao(sx,sy,out){
  const G=P3D.G;P3D.ndc.set(sx/G.W*2-1,-(sy/G.H)*2+1);P3D.ray.setFromCamera(P3D.ndc,P3D.cam);
  const r=P3D.ray.ray;if(r.direction.y>-0.02){r.direction.y=-0.02;r.direction.normalize();}
  return r.intersectPlane(P3D.plano,out||new THREE.Vector3())||(out||new THREE.Vector3()).set(0,0,0);
}
/* pixels por unidade (vertical) num ponto do chão */
function p3dPPU(P){const a=p3dTela(P);P3D.v1.set(P.x,P.y+1,P.z);const b=p3dTela(P3D.v1);return Math.max(1e-3,Math.hypot(a.x-b.x,a.y-b.y));}
function p3dPosCam(G){const cam=P3D.cam;cam.fov=G.fov;cam.aspect=G.W/G.H;cam.position.set(0,G.D*Math.sin(G.pitch),G.D*Math.cos(G.pitch));cam.up.set(0,1,0);cam.lookAt(0,0,0);
  cam.near=Math.max(0.1,G.D*0.05);cam.far=G.D*30;}
function p3dVista(sy0,shx,shy){
  const G=P3D.G,cam=P3D.cam;const cx=G.cx+(shx||0),cy=G.cy-(sy0||0)+(shy||0);
  cam.setViewOffset(G.W,G.H,G.W/2-cx,G.H/2-cy,G.W,G.H);cam.updateProjectionMatrix();cam.updateMatrixWorld();
}
function p3dMedir(){
  const bt=document.getElementById('battle'),cp=document.getElementById('bCampo');if(!bt||!cp||!P3D.on)return false;
  const W=Math.max(1,bt.clientWidth),H=Math.max(1,bt.clientHeight),st=bt.scrollTop;
  const rc=cp.getBoundingClientRect();if(!rc.width||!rc.height)return false;
  const sp={p:[],r:[]};
  for(const P of ['p','r'])for(let i=0;i<4;i++){const ln=document.getElementById('ln-'+P+'-'+i);const ch=ln&&ln.querySelector('.chao');if(!ln)return false;
    const r=(ch||ln).getBoundingClientRect(),rl=ln.getBoundingClientRect();
    sp[P].push({x:r.left+r.width/2,y:(ch?r.top+r.height/2:rl.bottom)+st,w:rl.width,spr:parseFloat(getComputedStyle(ln).getPropertyValue('--spr'))||80});}
  const yP=sp.p.reduce((a,s)=>a+s.y,0)/4,yR=sp.r.reduce((a,s)=>a+s.y,0)/4;
  const ret=W/H<0.8,cel=W<700;
  const G={W,H,campoW:rc.width,yRs:yR-st,yPs:yP-st,cx:rc.left+rc.width/2,cy:(yP+yR)/2,fov:ret?44:(H<700?40:36),pitch:(ret?34:30)*Math.PI/180,D:12,st0:st};
  P3D.G=G;for(const U of P3D.units.values())U.lw=0;
  P3D.r.setPixelRatio(p3dPR());P3D.r.setSize(W,H,false);p3dPosTam();
  // 1ª passada: escala do mundo (1,75 unidade = altura do quadro do personagem perto)
  p3dPosCam(G);p3dVista(st);
  const sprP=sp.p[0].spr;
  let pp=p3dChao(G.cx,yP-st);let u=p3dPPU(pp);
  G.D*=u/(sprP/1.75);p3dPosCam(G);p3dVista(st);
  // os lugares no chão
  P3D.spots=[];
  for(const P of ['p','r'])sp[P].forEach((s,i)=>{const w=p3dChao(s.x,s.y-st);const ppu=p3dPPU(w);P3D.spots.push({P,i,x:w.x,z:w.z,ppu,w:s.w/ppu,spr:s.spr});});
  const zs=P3D.spots.filter(s=>s.P==='p').map(s=>s.z),zr=P3D.spots.filter(s=>s.P==='r').map(s=>s.z);
  G.zP=zs.reduce((a,b)=>a+b,0)/4;G.zR=zr.reduce((a,b)=>a+b,0)/4;
  // até onde a tela enxerga (cantos) no chão: para espalhar capim e props só onde aparece
  const c0=p3dChao(0,0),c1=p3dChao(W,0),c2=p3dChao(0,H),c3=p3dChao(W,H);
  G.xMin=Math.min(c0.x,c2.x)-1;G.xMax=Math.max(c1.x,c3.x)+1;G.zMin=Math.min(c0.z,c1.z);G.zMax=Math.max(c2.z,c3.z)+1;
  G.cel=cel;
  // sombra: caixa da luz em volta do tabuleiro
  if(P3D.sol)p3dAjustaSol();
  return true;
}

/* ---------- v10: o tabuleiro "ilha flutuante" nas terras das lendas (Mata Adentro) ----------
   A ilha (v9, Card Wars, arte própria) continua: 8 PLACAS de terreno, um rio com ponte no meio, os heróis atrás das
   filas. O que mudou foi o mundo em volta e o que cresce em cada placa. Cada placa é um diorama do seu REINO:
   Sertão (milharal) = barro vermelho rachado, mandacaru, brasas; Mata (pomar) = musgo, raízes gigantes, samambaias;
   Águas (brejo) = água escura, vitória-régia, taboa; Noite (pasto) = pedras violeta, cerca torta, lampião de luz roxa;
   Arraial (neutro) = terra batida, bandeirinhas, barril. As 5 arenas (seção 8 do spec v10) trocam o céu dramático, a
   luz, o chão da ilha e os enfeites: 1 Porteira do Sertão (pôr do sol), 2 Mata Fechada (névoa e fachos de luz),
   3 Beira do Igapó (lua, neblina; as placas viram folhas gigantes de vitória-régia), 4 Tapera da Meia-Noite (lua
   cheia enorme), 5 Arraial das Lendas (festa à noite, fogueira, coreto). Na Meia-Noite (a rodada da "hora da
   colheita" do motor) a luz cai 30%, a lua sobe, a névoa engrossa e no Arraial a lua fica cor de brasa e solta fogos.
   Tabuleiros cosméticos (s.cosm.usa.tabuleiro[arena], Mascate e Vila) são variações da mesma arena (p3dVariante).
   Quase tudo que é parado vira UMA malha com cor por vértice (p3dJuntar) para não subir as chamadas de desenho. */
const P3D_Y0=-0.38;
const P3D_ARENA={
  1:{nome:'sertao',ceu:['#2A1C4E','#FF9A4A','#8A3646','#24102C'],nevoa:'#C8704E',nd:[2.3,5.4],sol:['#FFC890',1.25,[-10,6.5,4]],hemi:['#FFC09A','#5A2E2A',0.78],exp:1.04,props:'sertao',
     chao:'rachado',grama:['#B4643C','#9A5232','#C67A4E'],terra:['#8E4428','#6E3420','#542818','#3A1C14'],rio:'#2E7A80',rio2:'#8ACAC0',astro:'sol',nuvem:['#C86A58','#A85458','#7A3E52'],arv:'mandacaru',copa:['#4E8A4A','#3E7440'],linha:'#2A0E10',brilho:'#FF8A3A'},
  2:{nome:'mata',ceu:['#0E2E26','#B8C890','#3E6A54','#0C201C'],nevoa:'#6E8E74',nd:[1.9,4.4],sol:['#FFE0A0',0.82,[-4,13,3]],hemi:['#A8CCA4','#14221A',0.64],exp:0.96,props:'mata',
     chao:'musgo',grama:['#2E6230','#244E26','#3E7A38'],terra:['#5E4430','#4A3424','#3A281C','#281A12'],rio:'#1E6A60',rio2:'#6AB8A0',astro:'nevoa',nuvem:['#BCD4B4','#9EBC9E','#D8E6C8'],arv:'samauma',copa:['#2E6A30','#3E7E36','#24582A'],linha:'#0C1E10',brilho:'#FFF0B0'},
  3:{nome:'igapo',ceu:['#081230','#35587A','#22405A','#08141E'],nevoa:'#36586A',nd:[1.5,3.8],sol:['#B8D2FF',0.95,[7,11,6]],hemi:['#86A8D0','#18282A',0.88],exp:1.12,props:'igapo',
     chao:'lama',grama:['#2C5846','#22483A','#3A6A52'],terra:['#4A4036','#3A3228','#2C261E','#1E1A14'],rio:'#1C5868',rio2:'#6CB4C4',astro:'lua',nuvem:['#4A6A80','#3A586E','#5A7A92'],arv:'buriti',copa:['#2A5A40','#356A48'],linha:'#04101A',brilho:'#CFE4FF',folha:true},
  4:{nome:'tapera',ceu:['#0C0828','#4E3C86','#2E2458','#0E0A22'],nevoa:'#3C3068',nd:[1.7,4.2],sol:['#CCC4FF',0.92,[-6,12,7]],hemi:['#8E80D8','#1C1428',0.86],exp:1.1,props:'tapera',
     chao:'seco',grama:['#46523A','#384430','#56603F'],terra:['#5A5248','#463E36','#342E28','#221E1A'],rio:'#2A3A78',rio2:'#7A86D0',astro:'luaGrande',nuvem:['#3A3270','#2C2660','#4A4088'],arv:'seca',copa:['#3A3030','#2A2224'],linha:'#08061A',brilho:'#E8E0FF'},
  5:{nome:'arraial',ceu:['#0A0A2C','#62305E','#3A1C44','#100820'],nevoa:'#3E2244',nd:[1.9,4.6],sol:['#B4C0FF',0.62,[8,12,5]],hemi:['#7C70C0','#3A2418',0.8],exp:1.12,props:'arraial',
     chao:'terra',grama:['#6E4E34','#5E4230','#7E5C40'],terra:['#6A4A30','#563C26','#422E1E','#2C1E14'],rio:'#24467A',rio2:'#7A9AD8',astro:'lua',nuvem:['#5A3A6A','#4A2E5E','#6E4A7A'],arv:'copa',copa:['#2E5A34','#3A6A3C'],linha:'#0C0618',brilho:'#FFC870'}
};
/* tabuleiros cosméticos (Mascate: Sertão em Chamas, Mata ao Amanhecer, Igapó Seco, Tapera em Tempestade, Arraial de
   Fogos; Vila: Sertão ao Luar, Mata em Chuva, Igapó Cheio, Tapera em Névoa): só céu, luz e clima mudam */
const P3D_VAR={
  chamas:{ceu:['#3A0A10','#FF5A1E','#C23A1E','#3A0C0C'],nevoa:'#B0402A',sol:['#FFA060',1.35,[-9,6,4]],hemi:['#FF9A70','#4A1A14',0.8],brasas:3},
  luar:{ceu:['#0A1236','#3A4A88','#3A2E5E','#0C0A20'],nevoa:'#40406E',sol:['#BCC8FF',0.85,[-7,11,5]],hemi:['#8890D0','#2A1A20',0.8],astro:'luaGrande'},
  amanhecer:{ceu:['#5A7AC0','#FFD0A0','#E8A890','#40384A'],nevoa:'#E0B8A0',sol:['#FFE0B0',1.2,[9,7,5]],hemi:['#FFE0C8','#3A3020',0.9],astro:'sol'},
  chuva:{ceu:['#1E2C2C','#7A8C88','#4E605C','#1A2422'],nevoa:'#6E807C',sol:['#DDE8F0',0.75,[-4,13,3]],chuva:1,astro:'nevoa'},
  seco:{ceu:['#3A2A50','#F2B070','#C88A60','#4A2E30'],nevoa:'#A88A6A',sol:['#FFD8A0',1.1,[-8,8,5]],hemi:['#FFD8B0','#4A3424',0.85],astro:'sol',grama:['#8A7450','#76643E','#9A845A'],rio:'#4E8A80'},
  cheio:{rio:'#145060',nd:[1.3,3.4],nevoa:'#2C4E60',vagalumes:60},
  tempestade:{ceu:['#06060E','#3A3A5A','#22223A','#08080E'],nevoa:'#2C2C44',sol:['#C8D0FF',0.7,[-6,12,7]],chuva:1,raio:1,astro:'nuvem'},
  nevoa:{nd:[1.2,3.2],nevoa:'#4A3E78',neblina:2},
  fogos:{fogos:1}
};
function p3dVariante(n){
  try{const u=s&&s.cosm&&s.cosm.usa&&s.cosm.usa.tabuleiro;const v=u&&(u[n]||u[String(n)]);if(!v||(typeof B!=='undefined'&&B&&B.modo&&B.modo!=='arena'&&B.modo!=='treino'))return null;
    const id=String(v.id||v).toLowerCase();for(const k in P3D_VAR)if(id.indexOf(k)>=0)return k;}catch(e){}
  return null;
}
/* cada reino: topo, detalhe, detalhe claro, a faixa da cor do reino (borda), lateral e lateral escura */
const P3D_PLACA={
  milharal:{topo:'#C4643A',det:'#6E2E1A',det2:'#E8A066',borda:'#E8862E',lado:'#A84E26',lado2:'#5E2614'},
  pomar:{topo:'#3C8236',det:'#28602A',det2:'#86C85A',borda:'#3FA34D',lado:'#2E7A34',lado2:'#173E1C'},
  brejo:{topo:'#1C5664',det:'#2E9FB5',det2:'#7AD6D2',borda:'#2E9FB5',lado:'#1E7A8C',lado2:'#0C3A46'},
  pasto:{topo:'#3E3468',det:'#221C40',det2:'#7A68C0',borda:'#7B5BD6',lado:'#5642A2',lado2:'#2A2058'},
  neutro:{topo:'#A88256',det:'#7E5C3A',det2:'#D8B888',borda:'#C8965A',lado:'#8A6440',lado2:'#523822'}
};
function p3dArenaDef(){const n=(typeof B!=='undefined'&&B&&B.arena)||1;const a=((n-1)%5)+1;
  const v=(P3D.on&&P3D.vk!==undefined&&P3D.vn===n)?P3D.vk:(P3D.vn=n,P3D.vk=p3dVariante(a));const k=a+'|'+(v||'');
  if(P3D.defK===k&&P3D.def)return P3D.def;
  const D=Object.assign({},P3D_ARENA[a],v?P3D_VAR[v]:{});D.var=v;P3D.defK=k;P3D.def=D;return D;}
function p3dTerrs(){return (typeof B!=='undefined'&&B)?['p','r'].map(P=>B.sides[P].lanes.map(L=>L.terr).join()).join('|'):'';}
/* onde fica cada coisa: placas, rio, contorno da ilha (tudo medido a partir dos lugares reais) */
function p3dLayout(){
  const G=P3D.G,L={tiles:[]},folha=!!(P3D_ARENA[((((typeof B!=='undefined'&&B&&B.arena)||1)-1)%5)+1]||{}).folha;
  for(const P of ['p','r']){const r=P3D.spots.filter(s=>s.P===P).sort((a,b)=>a.i-b.i);let dx=0;for(let k=1;k<r.length;k++)dx+=Math.abs(r[k].x-r[k-1].x);dx=r.length>1?dx/(r.length-1):1.2;if(!(dx>0.2))dx=1.2;
    L[P]={dx,half:0,zf:-1e9,zb:1e9};
    for(const s of r){const w=dx*0.9,d=Math.min(dx*1.42,2.3),zf=s.z+Math.min(dx*0.46,0.75);const terr=(B&&B.sides[P].lanes[s.i].terr)||'neutro';
      const t={s,P,i:s.i,cx:s.x,w,d,zf,zb:zf-d,dx,k:Math.min(1,dx/1.05),terr,rr:Math.min(w,d)*(folha?0.46:0.17)};t.cz=(t.zf+t.zb)/2;L.tiles.push(t);
      L[P].half=Math.max(L[P].half,Math.abs(s.x)+w/2);L[P].zf=Math.max(L[P].zf,zf);L[P].zb=Math.min(L[P].zb,t.zb);}
  }
  L.zRio=(L.p.zb+L.r.zf)/2;L.rioW=Math.max(0.3,Math.min(0.7,(L.p.zb-L.r.zf)*0.13));
  L.zF=L.p.zf+1.15;L.zB=L.r.zb-2.4;L.cz=(L.zF+L.zB)/2;L.hd=(L.zF-L.zB)/2;
  L.hwF=L.p.half+0.8;L.hwB=L.r.half+1.05;
  L.hw=z=>{const f=Math.max(0,Math.min(1,(z-L.zB)/(L.zF-L.zB)));return L.hwB+(L.hwF-L.hwB)*f;};
  L.n=3.4; // "squircle"
  L.borda=(z)=>{const v=Math.min(0.999,Math.abs((z-L.cz)/L.hd));return L.hw(z)*Math.pow(1-Math.pow(v,L.n),1/L.n);};
  P3D.L=L;return L;
}
/* distância com sinal até a borda de uma placa (negativa dentro) */
function p3dSdPlaca(t,x,z,e){const hx=t.w/2+(e||0),hz=t.d/2+(e||0),r=t.rr+(e||0);const qx=Math.abs(x-t.cx)-hx+r,qz=Math.abs(z-t.cz)-hz+r;
  return Math.hypot(Math.max(qx,0),Math.max(qz,0))+Math.min(Math.max(qx,qz),0)-r;}
/* altura do chão num ponto: em cima de uma placa = 0; no chão da ilha = P3D_Y0 (com rampinha macia na borda) */
function p3dPe(x,z){const L=P3D.L;if(!L)return 0;let k=0;for(const t of L.tiles){const d=p3dSdPlaca(t,x,z);if(d<0.14){k=Math.max(k,p3dSm(0.14,-0.02,d));if(k>=1)break;}}return P3D_Y0*(1-k);}
function p3dAltura(x,z){return p3dPe(x,z);}
function p3dMontarCena(){
  const T=window.THREE,G=P3D.G,A=p3dArenaDef(),sc=P3D.scene;
  if(P3D.mundo){sc.remove(P3D.mundo);p3dDescartar(P3D.mundo);}
  const W=new T.Group();P3D.mundo=W;P3D.amb=[];sc.add(W);
  const n=(B&&B.arena)||1;P3D.arena=((n-1)%5)+1;
  P3D.r.toneMappingExposure=A.exp;
  p3dLayout();
  // céu: degradê que continua por baixo do horizonte (a ilha flutua no céu) + o clarão em volta do sol/lua
  const ceuM=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,toneMapped:false,
    uniforms:{cT:{value:p3dCor(A.ceu[0])},cH:{value:p3dCor(A.ceu[1])},cB:{value:p3dCor(A.ceu[2])},cF:{value:p3dCor(A.ceu[3])},cG:{value:p3dCor(A.brilho||'#FFFFFF')},dG:{value:new T.Vector3(0.5,0.3,-0.8).normalize()},kG:{value:0.55},escuro:{value:0}},
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'uniform vec3 cT;uniform vec3 cH;uniform vec3 cB;uniform vec3 cF;uniform vec3 cG;uniform vec3 dG;uniform float kG;uniform float escuro;varying vec3 vP;void main(){float y=vP.y;vec3 c=y>0.0?mix(cH,cT,pow(clamp(y*1.6,0.0,1.0),0.7)):mix(mix(cH,cB,smoothstep(0.0,0.35,-y)),cF,smoothstep(0.35,0.9,-y));float g=max(dot(vP,dG),0.0);c+=cG*(pow(g,10.0)*0.75+pow(g,3.0)*0.18)*kG;c*=1.0-escuro*0.38;c=mix(c,c*vec3(0.75,0.7,1.0),escuro*0.5);gl_FragColor=vec4(c,1.0);\n#include <encodings_fragment>\n}'});
  const ceu=new T.Mesh(new T.SphereGeometry(G.D*12,32,20),ceuM);
  ceu.renderOrder=-10;ceu.position.set(0,0,G.zR);W.add(ceu);P3D.ceu=ceu;
  sc.background=p3dCor(A.ceu[2]);
  sc.fog=new T.Fog(p3dCor(A.nevoa),G.D*A.nd[0]*1.5,G.D*A.nd[1]*1.6);
  // luzes: sol/lua (sombra macia) + hemisfério
  const sol=new T.DirectionalLight(p3dCor(A.sol[0]),A.sol[1]);sol.position.set(A.sol[2][0],A.sol[2][1],A.sol[2][2]);
  sol.shadow.mapSize.set(1024,1024);sol.shadow.bias=-0.0006;sol.shadow.normalBias=0.03;sol.shadow.radius=3;
  W.add(sol);W.add(sol.target);P3D.sol=sol;
  const hemi=new T.HemisphereLight(p3dCor(A.hemi[0]),p3dCor(A.hemi[1]),A.hemi[2]);W.add(hemi);P3D.hemi=hemi;P3D.hemiI=A.hemi[2];
  const fxl=new T.PointLight(0xFFE6A0,0,9,1.6);fxl.position.set(0,1.5,0);W.add(fxl);P3D.luzFx=fxl;
  // Meia-Noite: guarda os valores de partida (p3dMeiaNoiteQuadro mistura até o "escuro")
  P3D.mn={k:-1,sol:A.sol[1],hemi:A.hemi[2],near:sc.fog.near,far:sc.fog.far,fog:p3dCor(A.nevoa),fog2:p3dCor(A.nevoa).multiplyScalar(0.55).lerp(p3dCor('#2A2050'),0.35),fogos:0};
  p3dAjustaSol();
  p3dIlha(W,A);
  p3dPlacas(W,A);
  p3dLonge(W,A);
  p3dProps(W,A);
  p3dHerois(W,A);
  p3dMarcas(W);
  p3dParticulas(W);
}
/* ---------- Meia-Noite: luz cai 30%, névoa engrossa, a lua sobe (no Arraial ela vira brasa e solta fogos) ---------- */
function p3dMeiaNoite(){try{return !!(typeof B!=='undefined'&&B&&typeof horaColheita==='function'&&horaColheita(B));}catch(e){return false;}}
function p3dMeiaNoiteQuadro(dt,now){
  const M=P3D.mn;if(!M||!P3D.scene)return;
  const alvo=(window.__P3DMN!=null?!!window.__P3DMN:p3dMeiaNoite())?1:0;
  const k0=M.k;M.k=M.k<0?alvo:(RM?alvo:M.k+(alvo-M.k)*Math.min(1,dt*0.9));
  if(Math.abs(M.k-alvo)<0.002)M.k=alvo;
  const k=M.k,sc=P3D.scene;
  if(k!==k0||k0<0){
    if(P3D.sol)P3D.sol.intensity=M.sol*(1-0.3*k);
    P3D.hemiI=M.hemi*(1-0.3*k);if(P3D.hemi&&!P3D.raio)P3D.hemi.intensity=P3D.hemiI;
    if(sc.fog){sc.fog.near=M.near*(1-0.38*k);sc.fog.far=M.far*(1-0.3*k);sc.fog.color.copy(M.fog).lerp(M.fog2,k);}
    if(P3D.ceu)P3D.ceu.material.uniforms.escuro.value=k;
    if(P3D.lua2){const L2=P3D.lua2;L2.visible=k>0.01;L2.material.opacity=Math.min(1,k*1.4);L2.position.copy(L2.userData.p0).addScaledVector(L2.userData.sobe,(1-k));}
    if(P3D.astro&&P3D.astro.userData.lua){const u=P3D.astro.userData;if(P3D.arena===5){P3D.astro.material.color.setRGB(1,1-0.42*k,1-0.7*k);}
      P3D.astro.position.copy(u.p0).addScaledVector(u.sobe,-k*0.35);}
    if(P3D.ceu&&P3D.arena===5)P3D.ceu.material.uniforms.cG.value.set(k>0.5?'#FF6A2A':(p3dArenaDef().brilho||'#FFFFFF'));
  }
  // fogos no Arraial (e no tabuleiro "Arraial de Fogos" o tempo todo)
  const fogos=(P3D.arena===5&&k>0.6)||p3dArenaDef().fogos;
  if(fogos&&!RM&&P3D.L&&now>(M.fogos||0)){M.fogos=now+700+Math.random()*900;const L=P3D.L;
    const x=(Math.random()-0.5)*L.hwB*2.6,y=4+Math.random()*3,z=L.zB-3-Math.random()*5,c=['#FFD35A','#FF6A4A','#7FE0FF','#9BFF8A','#F49AC1','#C88BFF'][Math.floor(Math.random()*6)];
    for(let i=0;i<34;i++){const a=Math.random()*6.283,e=Math.acos(Math.random()*2-1),v=2.2+Math.random()*0.8;p3dPart({luz:true,x,y,z,vx:Math.cos(a)*Math.sin(e)*v,vy:Math.cos(e)*v,vz:Math.sin(a)*Math.sin(e)*v,g:1.4,drag:1.6,vida:1.1+Math.random()*0.4,tam:0.09,cor:i%4?c:'#FFFFFF'});}
    p3dPart({luz:true,x,y,z,vx:0,vy:0,vz:0,vida:0.35,tam:0.6,cor:c});}
}
function p3dAjustaSol(){
  const G=P3D.G,s=P3D.sol;if(!G||!s)return;const A=p3dArenaDef();
  const cz=(G.zP+G.zR)/2,half=Math.max(7,Math.abs(G.zP-G.zR)*0.5+5);
  s.target.position.set(0,0,cz);s.position.set(A.sol[2][0],A.sol[2][1],cz+A.sol[2][2]);
  const c=s.shadow.camera;c.left=-half*1.25;c.right=half*1.25;c.top=half*1.15;c.bottom=-half*1.15;c.near=0.5;c.far=60;c.updateProjectionMatrix();
}
/* retângulo arredondado (beginPath incluso; sem depender do roundRect do navegador) */
function p3dRR(g,x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
/* textura em canvas reaproveitável (sRGB) */
function p3dCanvasTex(cv,rep){const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}
/* ---------- a ilha: topo pintado, beirada de grama pingando, camadas de terra e a ponta de pedra embaixo ---------- */
function p3dIlha(W,A){
  const T=window.THREE,L=P3D.L,rnd=p3dRng(4242+P3D.arena*17),N=120;
  // contorno
  const cont=[];for(let k=0;k<N;k++){const a=k/N*Math.PI*2,c=Math.cos(a),s=Math.sin(a);const v=Math.sign(s)*Math.pow(Math.abs(s),2/L.n);const z=L.cz+L.hd*v;
    const u=Math.sign(c)*Math.pow(Math.abs(c),2/L.n);const j=1+(p3dFbm(Math.cos(a)*2.2+P3D.arena,Math.sin(a)*2.2)-0.5)*0.09;cont.push([u*L.hw(z)*j,L.cz+(z-L.cz)*j]);}
  L.cont=cont;
  const X=Math.max(L.hwF,L.hwB)*1.12,Z0=L.zB-0.3,Z1=L.zF+0.3;
  // topo: pintura em canvas (grama em manchas, florzinhas, sombrinha em volta das placas, margens de areia do rio)
  const S=1024,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
  const px=x=>(x+X)/(2*X)*S,pz=z=>(z-Z0)/(Z1-Z0)*S,sc=S/(2*X),scz=S/(Z1-Z0);
  g.fillStyle=A.grama[0];g.fillRect(0,0,S,S);
  for(let k=0;k<70;k++){const x=rnd()*S,y=rnd()*S,r=20+rnd()*70;g.fillStyle=rnd()<0.5?A.grama[1]:A.grama[2];g.globalAlpha=0.55;g.beginPath();g.ellipse(x,y,r,r*0.6,rnd()*3,0,6.283);g.fill();}
  g.globalAlpha=1;
  p3dPintaChao(g,S,A,rnd);
  // sombra de contato em volta de cada placa
  for(const t of L.tiles){g.save();g.filter='blur(10px)';g.fillStyle='rgba(30,40,10,.35)';const w=t.w*sc*1.06,h=t.d*scz*1.04;p3dRR(g,px(t.cx)-w/2,pz(t.cz)-h/2+6,w,h,t.rr*sc);g.fill();g.restore();}
  // rio: margem de areia
  const rioY=pz(L.zRio),rw=L.rioW*scz;
  g.fillStyle=A.margem||p3dMistura(A.grama[2],'#E8D2A0',0.45);g.beginPath();for(let x=0;x<=S;x+=16){const y=rioY+Math.sin(x*0.02)*6-rw*1.35;x?g.lineTo(x,y):g.moveTo(x,y);}for(let x=S;x>=0;x-=16)g.lineTo(x,rioY+Math.sin(x*0.02+1)*6+rw*1.35);g.closePath();g.fill();
  g.fillStyle=A.rio;g.beginPath();for(let x=0;x<=S;x+=16){const y=rioY-rw;x?g.lineTo(x,y):g.moveTo(x,y);}for(let x=S;x>=0;x-=16)g.lineTo(x,rioY+rw);g.closePath();g.fill();
  const topTex=p3dCanvasTex(cv);
  const sh=new T.Shape();cont.forEach(([x,z],k)=>k?sh.lineTo(x,-z):sh.moveTo(x,-z));sh.closePath();
  const tg=new T.ShapeGeometry(sh,1);tg.rotateX(-Math.PI/2);
  {const p=tg.attributes.position,uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)+X)/(2*X);uv[i*2+1]=1-(p.getZ(i)-Z0)/(Z1-Z0);}tg.setAttribute('uv',new T.BufferAttribute(uv,2));}
  const topo=new T.Mesh(tg,p3dMat('#FFFFFF',{map:topTex,rough:0.95}));topo.position.y=P3D_Y0;topo.receiveShadow=true;W.add(topo);
  // lateral: anéis do contorno em várias alturas, encolhendo até a ponta
  const niv=[[0,1.0,'g0'],[-0.1,1.012,'g0'],[-0.16,1.0,'g1'],[-0.17,0.995,'t0'],[-0.55,0.97,'t0'],[-0.56,0.968,'t1'],[-1.0,0.92,'t1'],[-1.01,0.918,'t2'],[-1.7,0.78,'t2'],[-2.6,0.55,'t3'],[-3.6,0.3,'t3'],[-4.6,0.08,'t3']];
  const cor={g0:A.grama[1],g1:p3dMistura(A.grama[1],'#000000',0.3),t0:A.terra[0],t1:A.terra[1],t2:A.terra[2],t3:A.terra[3]};
  const NL=niv.length,pos=new Float32Array(NL*N*3),col=new Float32Array(NL*N*3),idx=[];const c=new T.Color();
  for(let j=0;j<NL;j++){const [dy,sc0,ck]=niv[j];c.set(cor[ck]);
    for(let k=0;k<N;k++){const [x,z]=cont[k];const a=k/N*6.283;let s=sc0,y=dy;
      if(j===1)y+=-0.07*Math.max(0,Math.sin(a*19))-0.04*Math.max(0,Math.sin(a*7+1)); // grama pingando
      if(j>=8){s*=1+(p3dFbm(a*3,j*1.7)-0.5)*0.35;y+=(p3dFbm(a*4+2,j)-0.5)*0.5;}
      const i=(j*N+k)*3;pos[i]=x*s;pos[i+1]=P3D_Y0+y;pos[i+2]=L.cz+(z-L.cz)*s;col[i]=c.r;col[i+1]=c.g;col[i+2]=c.b;}}
  for(let j=0;j<NL-1;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N,cc=(j+1)*N+k,d=(j+1)*N+(k+1)%N;idx.push(a,cc,b,b,cc,d);}
  const lg=new T.BufferGeometry();lg.setAttribute('position',new T.BufferAttribute(pos,3));lg.setAttribute('color',new T.BufferAttribute(col,3));lg.setIndex(idx);lg.computeVertexNormals();
  const lado=new T.Mesh(lg,p3dMat('#FFFFFF',{vc:true,rough:0.9}));W.add(lado);
  // rio (faixa de água que corre) e as cachoeiras caindo das beiradas
  const wc=document.createElement('canvas');wc.width=256;wc.height=128;const w2=wc.getContext('2d');w2.fillStyle=A.rio;w2.fillRect(0,0,256,128);
  w2.strokeStyle=A.rio2;w2.lineWidth=4;w2.globalAlpha=0.7;w2.lineCap='round';for(let k=0;k<5;k++){const y=14+k*25,x0=(k*53)%256;w2.beginPath();for(let x=-20;x<=60;x+=5){const xx=x0+x;w2.lineTo(xx,y+Math.sin(x*0.15)*4);}w2.stroke();w2.beginPath();for(let x=-20;x<=60;x+=5){w2.lineTo(x0+x-256,y+Math.sin(x*0.15)*4);}w2.stroke();}
  w2.globalAlpha=1;w2.fillStyle='rgba(255,255,255,.3)';for(let k=0;k<14;k++){w2.beginPath();w2.arc((k*71)%256,(k*37)%128,3,0,6.283);w2.fill();}
  const wt=p3dCanvasTex(wc,true);
  const rioM=new T.MeshBasicMaterial({map:wt});P3D.rioTex=wt;
  const ex=L.borda(L.zRio)*1.0,nx=48,rp=[],ruv=[],ri=[];
  for(let k=0;k<=nx;k++){const x=-ex+2*ex*k/nx,wob=Math.sin(x*1.3)*0.06;for(const sd of [-1,1]){rp.push(x,P3D_Y0+0.012,L.zRio+wob+sd*L.rioW);ruv.push(x/(L.rioW*4),sd<0?0:1);}}
  for(let k=0;k<nx;k++){const a=k*2;ri.push(a,a+1,a+2,a+2,a+1,a+3);}
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(rp,3));rg.setAttribute('uv',new T.Float32BufferAttribute(ruv,2));rg.setIndex(ri);rg.computeVertexNormals();
  const rio=new T.Mesh(rg,rioM);W.add(rio);
  const cc=document.createElement('canvas');cc.width=64;cc.height=256;const c2=cc.getContext('2d');c2.fillStyle=A.rio;c2.fillRect(0,0,64,256);c2.fillStyle=A.rio2;for(let k=0;k<6;k++)c2.fillRect(6+k*10,(k*47)%256,4,70);
  const ct=p3dCanvasTex(cc,true);P3D.cachTex=ct;
  const cm=new T.MeshBasicMaterial({map:ct,transparent:true,vertexColors:true,side:T.DoubleSide,depthWrite:false});
  for(const sd of [-1,1]){const cg=new T.CylinderGeometry(L.rioW*0.95,L.rioW*0.55,3.6,14,6,true,sd>0?0:Math.PI,Math.PI);
    const p=cg.attributes.position,ca=new Float32Array(p.count*4);for(let i=0;i<p.count;i++){const y=(p.getY(i)+1.8)/3.6;ca[i*4]=ca[i*4+1]=ca[i*4+2]=1;ca[i*4+3]=Math.min(1,y*1.6);}cg.setAttribute('color',new T.BufferAttribute(ca,4));
    const m=new T.Mesh(cg,cm);m.position.set(sd*(ex-L.rioW*0.25),P3D_Y0-1.8+0.01,L.zRio);m.renderOrder=1;W.add(m);}
  P3D.amb.push(t=>{wt.offset.x=-t*0.12;ct.offset.y=t*0.9;});
  // pontezinha de madeira no meio
  const pts=[],npl=9,z0=L.zRio-L.rioW-0.2,z1=L.zRio+L.rioW+0.2,bw=Math.min(0.95,L.p.dx*0.75);
  for(let k=0;k<npl;k++){const f=k/(npl-1),z=z0+(z1-z0)*f,y=P3D_Y0+0.06+Math.sin(f*Math.PI)*0.16,rx=Math.cos(f*Math.PI)*0.5;pts.push({g:new T.BoxGeometry(bw,0.06,(z1-z0)/npl*0.92),m:p3dM4(0,y,z,-Math.atan(Math.cos(f*Math.PI)*0.16*Math.PI/(z1-z0)),(rnd()-0.5)*0.05,0),c:k%2?'#D89A5A':'#C88A4C'});}
  for(const sx of [-1,1]){
    for(const f of [0,1]){const z=f?z1+0.02:z0-0.02,y=P3D_Y0+0.06;pts.push({g:new T.CylinderGeometry(0.05,0.06,0.42,8),m:p3dM4(sx*bw*0.52,y+0.15,z),c:'#7A4A28'});pts.push({g:new T.SphereGeometry(0.075,10,8),m:p3dM4(sx*bw*0.52,y+0.4,z),c:'#E8B060'});}
    for(let k=0;k<8;k++){const fa=k/8,fb=(k+1)/8,za=z0+(z1-z0)*fa,zb=z0+(z1-z0)*fb,ya=P3D_Y0+0.2+Math.sin(fa*Math.PI)*0.16,yb=P3D_Y0+0.2+Math.sin(fb*Math.PI)*0.16;
      const L2=Math.hypot(zb-za,yb-ya)+0.02;pts.push({g:new T.BoxGeometry(0.07,0.16,L2),m:p3dM4(sx*bw*0.52,(ya+yb)/2,(za+zb)/2,-Math.atan2(yb-ya,zb-za),0,0),c:'#8A5A32'});}}
  const ponte=new T.Mesh(p3dJuntar(pts),p3dMat('#FFFFFF',{vc:true,rough:0.85}));ponte.castShadow=true;ponte.receiveShadow=true;W.add(ponte);
}
/* ---------- pintura do chão da ilha (cada arena um chão) ---------- */
function p3dMistura(a,b,k){const c=new THREE.Color(a).lerp(new THREE.Color(b),k);return '#'+c.getHexString();}
function p3dPintaChao(g,S,A,rnd){
  const tipo=A.chao||'musgo';
  for(let k=0;k<70;k++){const x=rnd()*S,y=rnd()*S,r=20+rnd()*70;g.fillStyle=rnd()<0.5?A.grama[1]:A.grama[2];g.globalAlpha=0.5;g.beginPath();g.ellipse(x,y,r,r*0.6,rnd()*3,0,6.283);g.fill();}
  g.globalAlpha=1;g.lineCap='round';g.lineJoin='round';
  if(tipo==='rachado'){ // barro vermelho rachado do sertão
    g.strokeStyle=p3dMistura(A.grama[1],'#2A0E08',0.55);
    for(let k=0;k<46;k++){let x=rnd()*S,y=rnd()*S,a=rnd()*6.283;g.lineWidth=2+rnd()*2.5;g.beginPath();g.moveTo(x,y);
      for(let j=0;j<6;j++){a+=(rnd()-0.5)*1.4;x+=Math.cos(a)*(14+rnd()*16);y+=Math.sin(a)*(14+rnd()*16);g.lineTo(x,y);}g.stroke();}
    g.fillStyle='rgba(255,210,150,.10)';for(let k=0;k<90;k++){g.beginPath();g.arc(rnd()*S,rnd()*S,2+rnd()*3,0,6.283);g.fill();}
    g.strokeStyle='#6E7A3A';g.lineWidth=2.5;for(let k=0;k<70;k++){const x=rnd()*S,y=rnd()*S;g.beginPath();g.moveTo(x-4,y-6);g.lineTo(x,y);g.lineTo(x+3,y-7);g.stroke();}
  }else if(tipo==='musgo'){ // chão de mata: musgo, folhas caídas
    g.strokeStyle=A.grama[1];g.lineWidth=3;for(let k=0;k<240;k++){const x=rnd()*S,y=rnd()*S;g.beginPath();g.moveTo(x-5,y-8);g.lineTo(x,y);g.lineTo(x+5,y-9);g.stroke();}
    const fl=['#8A6A2A','#6A4E22','#A8783A','#4E6A26'];for(let k=0;k<160;k++){g.fillStyle=fl[k%4];g.globalAlpha=0.7;g.beginPath();g.ellipse(rnd()*S,rnd()*S,5,2.4,rnd()*3,0,6.283);g.fill();}g.globalAlpha=1;
    g.strokeStyle='rgba(60,36,20,.55)';for(let k=0;k<10;k++){let x=rnd()*S,y=rnd()*S,a=rnd()*6.283;g.lineWidth=5+rnd()*4;g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){a+=(rnd()-0.5)*0.9;x+=Math.cos(a)*30;y+=Math.sin(a)*30;g.lineTo(x,y);}g.stroke();}
  }else if(tipo==='lama'){ // várzea: lama escura, poças, capim
    for(let k=0;k<26;k++){const x=rnd()*S,y=rnd()*S,r=14+rnd()*36;g.fillStyle=p3dMistura(A.rio,'#000000',0.3);g.globalAlpha=0.75;g.beginPath();g.ellipse(x,y,r,r*0.55,rnd()*3,0,6.283);g.fill();
      g.globalAlpha=0.35;g.strokeStyle=A.rio2;g.lineWidth=2;g.beginPath();g.ellipse(x,y,r*0.7,r*0.35,0,3.6,5.6);g.stroke();}g.globalAlpha=1;
    g.strokeStyle=A.grama[2];g.lineWidth=3;for(let k=0;k<200;k++){const x=rnd()*S,y=rnd()*S;g.beginPath();g.moveTo(x-3,y-10);g.lineTo(x,y);g.lineTo(x+4,y-11);g.stroke();}
  }else if(tipo==='seco'){ // capim seco e terra cinza da tapera
    g.fillStyle='rgba(20,16,30,.18)';for(let k=0;k<40;k++){g.beginPath();g.ellipse(rnd()*S,rnd()*S,10+rnd()*30,6+rnd()*14,rnd()*3,0,6.283);g.fill();}
    const cc=['#8A8458','#6E6A48','#A49A66'];for(let k=0;k<260;k++){g.strokeStyle=cc[k%3];g.lineWidth=2.5;const x=rnd()*S,y=rnd()*S;g.beginPath();g.moveTo(x-6,y-9);g.lineTo(x,y);g.lineTo(x+1,y-12);g.moveTo(x,y);g.lineTo(x+6,y-8);g.stroke();}
    g.fillStyle='#7A7488';for(let k=0;k<50;k++){g.beginPath();g.ellipse(rnd()*S,rnd()*S,4+rnd()*4,3,rnd()*3,0,6.283);g.fill();}
  }else{ // terra batida do arraial: pegadas, palha, confete
    g.fillStyle='rgba(40,24,12,.22)';for(let k=0;k<120;k++){const x=rnd()*S,y=rnd()*S;g.beginPath();g.ellipse(x,y,4,7,rnd()*3,0,6.283);g.fill();}
    g.strokeStyle='#D8B060';g.lineWidth=2;for(let k=0;k<120;k++){const x=rnd()*S,y=rnd()*S,a=rnd()*3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*10,y+Math.sin(a)*10);g.stroke();}
    const cf=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230','#E0565B'];for(let k=0;k<160;k++){g.fillStyle=cf[k%6];const x=rnd()*S,y=rnd()*S,a=rnd()*6.28;g.beginPath();g.moveTo(x+Math.cos(a)*6,y+Math.sin(a)*6);g.lineTo(x+Math.cos(a+2.1)*6,y+Math.sin(a+2.1)*6);g.lineTo(x+Math.cos(a+4.2)*6,y+Math.sin(a+4.2)*6);g.fill();}
  }
}
/* ---------- as 8 placas de terreno ---------- */
function p3dPintaReino(g,cw,ch,terr,rnd){
  const C=P3D_PLACA[terr]||P3D_PLACA.neutro;
  g.fillStyle=C.topo;g.fillRect(0,0,cw,ch);
  const vin=g.createRadialGradient(cw/2,ch/2,Math.min(cw,ch)*0.2,cw/2,ch/2,Math.max(cw,ch)*0.62);vin.addColorStop(0,'rgba(255,255,255,.06)');vin.addColorStop(1,'rgba(0,0,0,.22)');g.fillStyle=vin;g.fillRect(0,0,cw,ch);
  g.lineCap='round';g.lineJoin='round';
  if(terr==='milharal'){ // barro rachado + brasas
    g.strokeStyle=C.det;
    const raca=(x,y,a,n,w)=>{g.lineWidth=w;g.beginPath();g.moveTo(x,y);for(let j=0;j<n;j++){a+=(rnd()-0.5)*1.3;x+=Math.cos(a)*(16+rnd()*12);y+=Math.sin(a)*(16+rnd()*12);g.lineTo(x,y);if(rnd()<0.3&&w>2)raca(x,y,a+(rnd()<0.5?1:-1)*1.1,3,w*0.6);}g.stroke();};
    for(let k=0;k<9;k++)raca(rnd()*cw,rnd()*ch,rnd()*6.28,7,4.5);
    g.fillStyle=C.det2;g.globalAlpha=0.35;for(let k=0;k<50;k++){g.beginPath();g.arc(rnd()*cw,rnd()*ch,2+rnd()*2.5,0,6.283);g.fill();}g.globalAlpha=1;
    for(let k=0;k<7;k++){const x=rnd()*cw,y=rnd()*ch,r=7+rnd()*7;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(255,220,120,1)');gr.addColorStop(0.35,'rgba(255,120,40,.9)');gr.addColorStop(1,'rgba(255,80,20,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.283);g.fill();}
  }else if(terr==='pomar'){ // musgo, folhas e raízes
    for(let k=0;k<18;k++){g.fillStyle=k%3?C.det:C.det2;g.globalAlpha=k%3?0.65:0.35;g.beginPath();g.ellipse(rnd()*cw,rnd()*ch,12+rnd()*26,9+rnd()*14,rnd()*3,0,6.283);g.fill();}g.globalAlpha=1;
    g.strokeStyle='#5A3A22';for(let k=0;k<4;k++){let x=rnd()*cw,y=rnd()*ch,a=rnd()*6.28;g.lineWidth=7;g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){a+=(rnd()-0.5)*0.8;x+=Math.cos(a)*22;y+=Math.sin(a)*22;g.lineTo(x,y);}g.stroke();}
    const fl=['#9A7A2E','#C8903A','#6E8A2E'];for(let k=0;k<26;k++){g.fillStyle=fl[k%3];g.beginPath();g.ellipse(rnd()*cw,rnd()*ch,6,2.6,rnd()*3,0,6.283);g.fill();}
  }else if(terr==='brejo'){ // água escura com vitória-régia e reflexos
    g.strokeStyle=C.det2;g.globalAlpha=0.32;g.lineWidth=2.5;for(let k=0;k<16;k++){const x=rnd()*cw,y=rnd()*ch,r=10+rnd()*22;g.beginPath();g.ellipse(x,y,r,r*0.45,0,0,6.283);g.stroke();}
    g.globalAlpha=0.18;g.fillStyle='#FFFFFF';for(let k=0;k<10;k++){g.fillRect(rnd()*cw,rnd()*ch,18+rnd()*20,2.5);}g.globalAlpha=1;
    for(let k=0;k<5;k++){const x=rnd()*cw,y=rnd()*ch,r=12+rnd()*9,a=rnd()*6.28;g.fillStyle='#4E9A3E';g.beginPath();g.moveTo(x,y);g.arc(x,y,r,a+0.25,a+6.03);g.closePath();g.fill();g.strokeStyle='#B04A4A';g.lineWidth=2;g.beginPath();g.arc(x,y,r,a+0.25,a+6.03);g.stroke();}
  }else if(terr==='pasto'){ // pedras violeta (calçamento antigo) com névoa
    g.fillStyle=C.det;g.fillRect(0,0,cw,ch);
    const L=30;for(let y=-L/2,row=0;y<ch+L;y+=L*0.82,row++)for(let x=(row%2)*L/2-L/2;x<cw+L;x+=L){const w=L*(0.78+rnd()*0.14),h=L*(0.64+rnd()*0.14);
      g.fillStyle=p3dMistura(C.topo,rnd()<0.5?'#000000':'#9A8AD8',rnd()*0.22);p3dRR(g,x-w/2,y-h/2,w,h,8);g.fill();g.fillStyle='rgba(200,180,255,.16)';p3dRR(g,x-w/2+2,y-h/2+2,w*0.6,h*0.35,6);g.fill();}
    g.fillStyle='rgba(210,200,255,.10)';for(let k=0;k<8;k++){g.beginPath();g.ellipse(rnd()*cw,rnd()*ch,40+rnd()*40,14+rnd()*12,0,0,6.283);g.fill();}
  }else{ // arraial: terra batida, palha e confete
    g.fillStyle=C.det;g.globalAlpha=0.5;for(let k=0;k<24;k++){g.beginPath();g.ellipse(rnd()*cw,rnd()*ch,6+rnd()*10,4+rnd()*6,rnd()*3,0,6.283);g.fill();}g.globalAlpha=1;
    g.strokeStyle=C.det2;g.lineWidth=2;for(let k=0;k<40;k++){const x=rnd()*cw,y=rnd()*ch,a=rnd()*3;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*12,y+Math.sin(a)*12);g.stroke();}
    const cf=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230'];for(let k=0;k<30;k++){g.fillStyle=cf[k%5];const x=rnd()*cw,y=rnd()*ch,a=rnd()*6.28;g.beginPath();g.moveTo(x+Math.cos(a)*7,y+Math.sin(a)*7);g.lineTo(x+Math.cos(a+2.1)*7,y+Math.sin(a+2.1)*7);g.lineTo(x+Math.cos(a+4.2)*7,y+Math.sin(a+4.2)*7);g.fill();}
  }
}
function p3dPintaPlaca(g,x0,y0,cw,ch,terr,seed,folha){
  const C=P3D_PLACA[terr]||P3D_PLACA.neutro,rnd=p3dRng(seed);
  g.save();g.translate(x0,y0);
  if(folha){ // Beira do Igapó: a placa é uma folha gigante de vitória-régia, a borda virada na cor do reino
    g.fillStyle='#0E3440';g.fillRect(0,0,cw,ch);
    const cx=cw/2,cy=ch/2,rx=cw*0.47,ry=ch*0.47;
    g.save();g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,6.283);g.clip();
    g.fillStyle='#3E8A36';g.fillRect(0,0,cw,ch);
    g.globalAlpha=0.4;p3dPintaReino(g,cw,ch,terr,rnd);g.globalAlpha=1;
    g.strokeStyle='rgba(30,70,24,.75)';g.lineWidth=3;for(let k=0;k<22;k++){const a=k/22*6.283;g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(a)*rx,cy+Math.sin(a)*ry);g.stroke();}
    g.strokeStyle='rgba(30,70,24,.45)';g.lineWidth=2;for(let r=0.3;r<1;r+=0.22){g.beginPath();g.ellipse(cx,cy,rx*r,ry*r,0,0,6.283);g.stroke();}
    g.restore();
    g.lineWidth=20;g.strokeStyle=C.borda;g.beginPath();g.ellipse(cx,cy,rx-10,ry-10,0,0,6.283);g.stroke();
    g.lineWidth=3.5;g.strokeStyle='rgba(20,10,10,.55)';g.beginPath();g.ellipse(cx,cy,rx-22,ry-22,0,0,6.283);g.stroke();
    g.restore();return;
  }
  p3dPintaReino(g,cw,ch,terr,rnd);
  // a faixa na cor do reino (como a borda de uma carta), um traço escuro por dentro e um fio claro por fora
  const bi=13;g.lineWidth=16;g.strokeStyle=C.borda;p3dRR(g,bi,bi,cw-2*bi,ch-2*bi,30);g.stroke();
  g.lineWidth=3.5;g.strokeStyle='rgba(20,8,4,.6)';p3dRR(g,bi+9,bi+9,cw-2*bi-18,ch-2*bi-18,22);g.stroke();
  g.lineWidth=3;g.strokeStyle='rgba(255,236,200,.35)';p3dRR(g,bi-7,bi-7,cw-2*bi+14,ch-2*bi+14,36);g.stroke();
  g.restore();
}
function p3dPintaLado(g,x0,y0,cw,ch,terr,folha){const C=P3D_PLACA[terr]||P3D_PLACA.neutro;g.save();g.translate(x0,y0);
  if(folha){g.fillStyle=C.borda;g.fillRect(0,0,cw,ch*0.5);g.fillStyle='#7A2E2E';g.fillRect(0,ch*0.5,cw,ch*0.5);g.fillStyle='rgba(255,255,255,.18)';for(let x=4;x<cw;x+=10)g.fillRect(x,ch*0.5,2,ch*0.5);g.restore();return;}
  g.fillStyle=C.borda;g.fillRect(0,0,cw,ch*0.28);g.fillStyle=C.lado;g.fillRect(0,ch*0.28,cw,ch*0.72);
  g.fillStyle=C.lado2;g.fillRect(0,ch*0.82,cw,ch*0.18);
  g.fillStyle='rgba(0,0,0,.18)';for(let x=6;x<cw;x+=22){g.fillRect(x,ch*0.3,2,ch*0.5);}
  g.restore();}
/* ---------- peças de diorama (coordenadas locais; viram uma malha só com p3dJuntar) ---------- */
function p3dPeca(L,g,x,y,z,rx,ry,rz,sx,sy,sz,c){L.push({g,m:p3dM4(x,y,z,rx,ry,rz,sx,sy,sz),c});return L;}
function p3dPor(dest,parts,x,y,z,ry,s,sy){const M=p3dM4(x,y,z,0,ry||0,0,s||1,sy||s||1,s||1);for(const p of parts)dest.push({g:p.g,m:M.clone().multiply(p.m),c:p.c});return dest;}
const P3DG={}; // geometrias base (criadas uma vez por cena)
function p3dGeo(){const T=THREE;if(P3DG.ok)return P3DG;
  Object.assign(P3DG,{ok:true,cil:new T.CylinderGeometry(1,1,1,8),cilL:new T.CylinderGeometry(1,1,1,12),cone:new T.ConeGeometry(1,1,7),cone4:new T.ConeGeometry(1,1,4),cone3:new T.ConeGeometry(1,1,3),
    esf:new T.SphereGeometry(1,12,9),esfP:new T.SphereGeometry(1,7,5),meia:new T.SphereGeometry(1,14,7,0,6.283,0,Math.PI/2),caixa:new T.BoxGeometry(1,1,1),pedra:new T.DodecahedronGeometry(1,0),
    arco:new T.TorusGeometry(1,0.12,6,12,Math.PI),anel:new T.TorusGeometry(1,0.08,5,20),disco:new T.CylinderGeometry(1,1,1,20),ico:new T.IcosahedronGeometry(1,1)});
  // triângulo de bandeirinha (plano, dupla face)
  const tg=new T.BufferGeometry();tg.setAttribute('position',new T.Float32BufferAttribute([-0.5,0,0, 0.5,0,0, 0,-1,0, 0.5,0,0, -0.5,0,0, 0,-1,0],3));tg.computeVertexNormals();P3DG.tri=tg;
  return P3DG;}
const P3DB={
  mandacaru(h,c){const G=p3dGeo(),L=[],cc=c||'#4E8A4A',c2=p3dMistura(cc,'#000000',0.18);h=h||0.7;
    p3dPeca(L,G.cil,0,h/2,0,0,0,0,0.065,h,0.065,cc);p3dPeca(L,G.esf,0,h,0,0,0,0,0.065,0.07,0.065,cc);
    for(const sd of [-1,1]){const ya=h*(sd>0?0.42:0.55),ha=h*(sd>0?0.42:0.32);p3dPeca(L,G.cil,sd*0.09,ya,0,0,0,Math.PI/2,0.045,0.14,0.045,c2);
      p3dPeca(L,G.cil,sd*0.16,ya+ha/2,0,0,0,0,0.048,ha,0.048,c2);p3dPeca(L,G.esf,sd*0.16,ya+ha,0,0,0,0,0.048,0.05,0.048,c2);}
    p3dPeca(L,G.esfP,0.02,h+0.06,0.02,0,0,0,0.035,0.03,0.035,'#D04A7A');return L;},
  xique(){const G=p3dGeo(),L=[];for(let k=0;k<4;k++){const a=k*1.7,h=0.16+(k%2)*0.08;p3dPeca(L,G.cil,Math.cos(a)*0.05,h/2,Math.sin(a)*0.05,Math.sin(a)*0.35,0,Math.cos(a)*0.35,0.032,h,0.032,'#5A8A44');}return L;},
  pedra(c,s){const G=p3dGeo();return p3dPeca([],G.pedra,0,s*0.4,0,0.3,0.7,0.2,s,s*0.7,s*0.85,c);},
  raiz(c){const G=p3dGeo(),L=[];p3dPeca(L,G.arco,0,0,0,0,0,0,0.22,0.3,0.6,c);p3dPeca(L,G.arco,0.12,0,0.05,0,0.6,0,0.15,0.2,0.5,p3dMistura(c,'#000000',0.15));return L;},
  samambaia(c){const G=p3dGeo(),L=[];for(let k=0;k<7;k++){const a=k/7*6.283;p3dPeca(L,G.cone4,Math.cos(a)*0.09,0.12,Math.sin(a)*0.09,Math.sin(a)*1.0,0,-Math.cos(a)*1.0,0.035,0.3,0.012,k%2?c:p3dMistura(c,'#B8E070',0.25));}return L;},
  bromelia(){const G=p3dGeo(),L=[];for(let k=0;k<6;k++){const a=k/6*6.283;p3dPeca(L,G.cone4,Math.cos(a)*0.04,0.07,Math.sin(a)*0.04,Math.sin(a)*0.7,0,-Math.cos(a)*0.7,0.03,0.18,0.012,'#4E8A3A');}
    p3dPeca(L,G.cone,0,0.1,0,0,0,0,0.035,0.14,0.035,'#D83A4A');return L;},
  tronco(c){const G=p3dGeo(),L=[];p3dPeca(L,G.cilL,0,0.08,0,0,0,Math.PI/2,0.08,0.42,0.08,c||'#6A4428');p3dPeca(L,G.disco,0.211,0.08,0,0,0,Math.PI/2,0.062,0.01,0.062,'#2A1A10');p3dPeca(L,G.esfP,0.02,0.15,0.02,0,0,0,0.1,0.03,0.07,'#4E8A3A');return L;},
  vitoria(s){const G=p3dGeo(),L=[];p3dPeca(L,G.disco,0,0.012,0,0,0,0,s,0.012,s,'#4E9A3E');p3dPeca(L,G.anel,0,0.024,0,Math.PI/2,0,0,s,s,0.5,'#A84444');return L;},
  florAgua(){const G=p3dGeo(),L=[];for(let k=0;k<6;k++){const a=k/6*6.283;p3dPeca(L,G.esfP,Math.cos(a)*0.03,0.04,Math.sin(a)*0.03,0,-a,0.6,0.03,0.012,0.016,k%2?'#FFFFFF':'#FFC8E0');}p3dPeca(L,G.esfP,0,0.05,0,0,0,0,0.02,0.02,0.02,'#FFE066');return L;},
  taboa(h){const G=p3dGeo(),L=[];h=h||0.7;p3dPeca(L,G.cil,0,h/2,0,0,0,0,0.014,h,0.014,'#4E7A32');p3dPeca(L,G.cil,0,h*0.88,0,0,0,0,0.035,0.16,0.035,'#6A3A1E');p3dPeca(L,G.cone3,0.05,h*0.35,0,0,0,-0.25,0.03,h*0.6,0.01,'#5E8A3A');return L;},
  cerca(c){const G=p3dGeo(),L=[];c=c||'#4A3A40';for(let k=0;k<3;k++)p3dPeca(L,G.caixa,(k-1)*0.18,0.17,0,0,0,(k-1)*0.12+(k===2?0.2:0),0.04,0.34+(k%2)*0.06,0.04,c);
    p3dPeca(L,G.caixa,0,0.22,0.02,0,0,0.12,0.42,0.035,0.025,p3dMistura(c,'#000000',0.2));p3dPeca(L,G.caixa,0,0.1,0.02,0,0,-0.08,0.4,0.03,0.025,c);return L;},
  lampiao(){const G=p3dGeo(),L=[];p3dPeca(L,G.cil,0,0.3,0,0,0,0,0.02,0.6,0.02,'#2A2230');p3dPeca(L,G.caixa,0.06,0.58,0,0,0,0,0.13,0.02,0.02,'#2A2230');
    p3dPeca(L,G.cone4,0.12,0.52,0,Math.PI,Math.PI/4,0,0.05,0.035,0.05,'#2A2230');return L;},
  mastro(h,c){const G=p3dGeo();return p3dPeca([],G.cil,0,h/2,0,0,0,0,0.022,h,0.022,c||'#5A3A22');},
  barril(){const G=p3dGeo(),L=[];p3dPeca(L,G.cilL,0,0.11,0,0,0,0,0.09,0.22,0.09,'#8A5A34');for(const y of [0.04,0.18])p3dPeca(L,G.anel,0,y,0,Math.PI/2,0,0,0.092,0.092,0.25,'#3A2A20');return L;},
  pote(){const G=p3dGeo(),L=[];p3dPeca(L,G.esf,0,0.08,0,0,0,0,0.08,0.08,0.08,'#B8643A');p3dPeca(L,G.cil,0,0.16,0,0,0,0,0.04,0.04,0.04,'#A0542E');return L;}
};
/* cordão de bandeirinhas entre dois pontos (local) */
function p3dBandeiras(L,ax,ay,az,bx,by,bz,n,cores,cai,tam){const G=p3dGeo();tam=tam||0.08;
  for(let k=0;k<n;k++){const f=(k+0.5)/n,x=ax+(bx-ax)*f,z=az+(bz-az)*f,y=ay+(by-ay)*f-Math.sin(f*Math.PI)*(cai||0.08);
    p3dPeca(L,G.tri,x,y,z,0,-Math.atan2(bz-az,bx-ax),0,tam,tam*1.1,1,cores[k%cores.length]);}
  const len=Math.hypot(bx-ax,by-ay,bz-az);p3dPeca(L,G.caixa,(ax+bx)/2,(ay+by)/2-(cai||0.08)*0.62,(az+bz)/2,0,-Math.atan2(bz-az,bx-ax),0,len,0.008,0.008,'#2A2018');return L;}
const P3D_CORES_REINO=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230'];
function p3dPlacas(W,A){
  const T=window.THREE,L=P3D.L,folha=!!A.folha;
  // atlas: 4 colunas x 2 linhas; cada célula = topo (400 px) + faixa da lateral (96 px)
  const CW=256,CT=400,CS=96,CH=512,cv=document.createElement('canvas');cv.width=CW*4;cv.height=CH*2;const g=cv.getContext('2d');
  L.tiles.forEach((t,n)=>{const cx=(n%4)*CW,cy=Math.floor(n/4)*CH;t.cel=[cx,cy];p3dPintaPlaca(g,cx,cy,CW,CT,t.terr,77+n*13+P3D.arena,folha);p3dPintaLado(g,cx,cy+CT+8,CW,CS-8,t.terr,folha);});
  const tex=p3dCanvasTex(cv);
  const H=folha?0.12:0.28,bev=0.05,alt=H+2*bev;
  const geos=[],cascos=[];
  const forma=(t,e)=>{const s=new T.Shape(),hx=t.w/2-bev+e,hz=t.d/2-bev+e,r=Math.max(0.02,t.rr-bev+e);
    s.moveTo(-hx+r,-hz);s.lineTo(hx-r,-hz);s.quadraticCurveTo(hx,-hz,hx,-hz+r);s.lineTo(hx,hz-r);s.quadraticCurveTo(hx,hz,hx-r,hz);s.lineTo(-hx+r,hz);s.quadraticCurveTo(-hx,hz,-hx,hz-r);s.lineTo(-hx,-hz+r);s.quadraticCurveTo(-hx,-hz,-hx+r,-hz);return s;};
  for(const t of L.tiles){
    const eg=new T.ExtrudeGeometry(forma(t,0),{depth:H,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:folha?10:6});
    eg.rotateX(-Math.PI/2);eg.translate(t.cx,-(H+bev),t.cz);
    const p=eg.attributes.position,nm=eg.attributes.normal,uv=eg.attributes.uv;const ytop=0,ybot=-alt;
    const ix=t.w/2-t.rr,iz=t.d/2-t.rr;
    for(let i=0;i<p.count;i++){const x=p.getX(i)-t.cx,y=p.getY(i),z=p.getZ(i)-t.cz;const ny=nm.getY(i);
      if(Math.abs(ny)<0.999){const qx=Math.max(-ix,Math.min(ix,x)),qz=Math.max(-iz,Math.min(iz,z));let hx=x-qx,hz=z-qz;const hl=Math.hypot(hx,hz)||1;hx/=hl;hz/=hl;
        const k=y>-bev?Math.min(1,(y+bev)/bev):y<ybot+bev?-Math.min(1,(ybot+bev-y)/bev):0;const kk=Math.abs(k),vy=Math.sign(k)*Math.sin(kk*Math.PI/2),vh=Math.cos(kk*Math.PI/2);
        nm.setXYZ(i,hx*vh,vy,hz*vh);}
      let u,v;
      if(nm.getY(i)>0.5){u=(t.cel[0]+(x/t.w+0.5)*CW)/(CW*4);v=1-(t.cel[1]+(z/t.d+0.5)*CT)/(CH*2);}
      else{const f=(Math.atan2(z/t.d,x/t.w)/6.283+0.5);u=(t.cel[0]+4+f*(CW-8))/(CW*4);const fy=Math.max(0,Math.min(1,(ytop-y)/alt));v=1-(t.cel[1]+CT+10+fy*(CS-14))/(CH*2);}
      uv.setXY(i,u,v);}
    geos.push(eg);
    const hg=new T.ExtrudeGeometry(forma(t,0.035),{depth:H+0.03,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:folha?8:5});hg.rotateX(-Math.PI/2);hg.translate(t.cx,-(H+bev)-0.03+0.035,t.cz);cascos.push(hg);
  }
  const junta=(list,uv)=>{let n=0;for(const q of list)n+=q.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=uv?new Float32Array(n*2):null;let o=0;
    for(const q of list){P.set(q.attributes.position.array,o*3);N.set(q.attributes.normal.array,o*3);if(U)U.set(q.attributes.uv.array,o*2);o+=q.attributes.position.count;q.dispose();}
    const G2=new T.BufferGeometry();G2.setAttribute('position',new T.BufferAttribute(P,3));G2.setAttribute('normal',new T.BufferAttribute(N,3));if(U)G2.setAttribute('uv',new T.BufferAttribute(U,2));return G2;};
  const placas=new T.Mesh(junta(geos,true),p3dMat('#FFFFFF',{map:tex,rough:0.85}));placas.receiveShadow=true;placas.castShadow=true;W.add(placas);
  const casco=new T.Mesh(junta(cascos,false),new T.MeshBasicMaterial({color:p3dCor(A.linha),side:T.BackSide}));W.add(casco);
  // ---- o diorama de cada placa: peças paradas (uma malha), plantas que balançam (outra), brilhos (uma terceira) ----
  const P=[],V=[],E=[],pocas=[],brasas=[],lampioes=[];
  for(const t of L.tiles){const r=p3dRng(991+t.i*31+(t.P==='r'?500:0)+P3D.arena*7),k=t.k,hw=t.w/2*(folha?0.8:1),zb=t.zb+(folha?t.d*0.1:0),d=t.d*(folha?0.8:1);
    const fundo=zb+0.16*k,lado=sd=>t.cx+sd*hw*0.78;
    if(t.terr==='milharal'){
      const sd=t.i%2?1:-1;p3dPor(P,P3DB.mandacaru(0.95,'#4E8A4A'),lado(sd),0,fundo+0.06,r()*6,k*0.6); // v11: mais baixos
      p3dPor(P,P3DB.xique(),lado(-sd)*0.98+t.cx*0.02,0,fundo,r()*6,k*0.9);
      p3dPor(P,P3DB.xique(),t.cx+(r()-0.5)*hw*0.4,0,fundo-0.02,r()*6,k);
      for(let j=0;j<3;j++)p3dPor(P,P3DB.pedra(j%2?'#8E4A30':'#6E3A26',0.07+r()*0.05),t.cx+(r()-0.5)*hw*1.5,0,t.cz+(r()-0.2)*d*0.5,r()*6,k);
      for(let j=0;j<5;j++)brasas.push([t.cx+(r()-0.5)*hw*1.4,t.cz+(r()-0.5)*d*0.6]);
    }else if(t.terr==='pomar'){
      const sd=t.i%2?1:-1;p3dPor(P,P3DB.raiz('#6A4428'),lado(sd),0,fundo,(r()-0.5)*0.6+(sd>0?0:Math.PI),k*1.1);
      p3dPor(P,P3DB.raiz('#5A3A22'),lado(-sd)*0.9+t.cx*0.1,0,fundo+0.05,r()*6,k*0.8);
      p3dPor(P,P3DB.tronco('#6A4428'),t.cx,0,fundo-0.04,(r()-0.5)*0.4,k*0.9);
      for(let j=0;j<3;j++)p3dPor(V,P3DB.samambaia(j%2?'#3E8E3A':'#2E7A34'),t.cx+(j-1)*hw*0.75+(r()-0.5)*0.08,0,fundo+0.12+r()*0.1,r()*6,k*(0.9+r()*0.4));
      p3dPor(P,P3DB.bromelia(),t.cx+(r()-0.5)*hw*1.2,0,t.cz+d*0.18,r()*6,k);
    }else if(t.terr==='brejo'){
      const rx=Math.min(hw*0.78,0.62),rz=Math.min(d*0.22,0.34),z=zb+rz+0.1;pocas.push({x:t.cx,z,rx,rz});
      for(let j=0;j<3;j++){const a=j*2.1+r();p3dPor(P,P3DB.vitoria(0.12+r()*0.06),t.cx+Math.cos(a)*rx*0.55,0.006,z+Math.sin(a)*rz*0.5,r()*6,k);}
      p3dPor(P,P3DB.florAgua(),t.cx+rx*0.2,0.01,z-rz*0.1,0,k);
      for(const sd of [-1,1])for(let j=0;j<3;j++)p3dPor(V,P3DB.taboa(0.4+r()*0.18),t.cx+sd*(hw*0.84-j*0.06),0,zb+0.1+j*0.15,r()*6,k);
    }else if(t.terr==='pasto'){
      const sd=t.i%2?1:-1;p3dPor(P,P3DB.cerca('#4A3A48'),t.cx-sd*hw*0.35,0,fundo,(r()-0.5)*0.4,k*1.1);
      p3dPor(P,P3DB.lampiao(),lado(sd),0,fundo+0.05,sd>0?Math.PI:0,k*1.05);lampioes.push([lado(sd)+(sd>0?-1:1)*0.12*k*1.05,0.48*k*1.05,fundo+0.05,k]);
      for(let j=0;j<3;j++)p3dPor(P,P3DB.pedra(j%2?'#5A5470':'#46405E',0.06+r()*0.05),t.cx+(r()-0.5)*hw*1.5,0,t.cz+(r()-0.3)*d*0.5,r()*6,k);
    }else{
      const ax=t.cx-hw*0.72,bx=t.cx+hw*0.72,h=0.62*k;p3dPor(P,P3DB.mastro(h),ax,0,fundo,0,1);p3dPor(P,P3DB.mastro(h),bx,0,fundo,0,1);
      p3dBandeiras(P,ax,h*0.96,fundo,bx,h*0.96,fundo,7,['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230','#E0565B'],0.1*k,0.09*k);
      p3dPor(P,P3DB.barril(),t.cx+hw*0.55,0,t.cz+d*0.15,r()*6,k);p3dPor(P,P3DB.pote(),t.cx-hw*0.6,0,t.cz+d*0.2,0,k*0.8);
    }
  }
  if(P.length){const m=new T.Mesh(p3dJuntar(P),p3dMat('#FFFFFF',{vc:true,rough:0.8}));m.castShadow=true;m.receiveShadow=true;W.add(m);}
  if(V.length){const m=new T.Mesh(p3dJuntar(V),p3dBalanco(p3dMat('#FFFFFF',{vc:true,rough:0.8}),0.07,'vert'));m.castShadow=true;W.add(m);}
  if(pocas.length){const ag=p3dAgua('#1E6474');const pg=[];for(const q of pocas){pg.push({g:new T.CircleGeometry(1,28).rotateX(-Math.PI/2),m:p3dM4(q.x,0.008,q.z,0,0,0,q.rx,1,q.rz)});}
    const m=new T.Mesh(p3dJuntar(pg),ag);m.receiveShadow=true;W.add(m);
    const ag2=[];for(const q of pocas)ag2.push({g:new T.RingGeometry(1,1.14,28).rotateX(-Math.PI/2),m:p3dM4(q.x,0.006,q.z,0,0,0,q.rx,1,q.rz)});W.add(new T.Mesh(p3dJuntar(ag2),p3dMat('#2A4A3A',{rough:0.9})));}
  // luz roxa dos lampiões da Noite (sem luz de verdade: um brilho que pulsa)
  if(lampioes.length){const G=p3dGeo(),lm=new T.MeshBasicMaterial({color:'#D4B8FF',toneMapped:false});const lg=[];for(const [x,y,z,k] of lampioes)lg.push({g:G.esfP,m:p3dM4(x,y,z,0,0,0,0.035*k,0.045*k,0.035*k)});
    W.add(new T.Mesh(p3dJuntar(lg),lm));const halo=lampioes.map(([x,y,z,k])=>({x,y,z,k}));
    const sp=p3dPontos(W,halo.map(h=>[h.x,h.y,h.z]),'#B08AFF',0.55,0.85);P3D.amb.push(t=>{sp.material.opacity=0.65+Math.sin(t*2.3)*0.2;});}
  // brasas que sobem das rachaduras do Sertão
  if(brasas.length&&!RM)p3dBrasas(W,brasas,'#FF8A30');
}
/* pontos de luz (halos) parados */
function p3dPontos(W,lista,cor,tam,op){const T=THREE,p=new Float32Array(lista.length*3);lista.forEach((q,i)=>p.set(q,i*3));const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
  const m=new T.PointsMaterial({color:cor,size:tam,map:p3dTex('brilho'),transparent:true,opacity:op==null?1:op,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true,toneMapped:false});const pts=new T.Points(g,m);W.add(pts);return pts;}
/* brasas: faíscas que nascem no chão, sobem balançando e apagam (um Points só) */
function p3dBrasas(W,orig,cor,n){
  const T=THREE;n=n||Math.min(60,orig.length*5);const p=new Float32Array(n*3),base=[];for(let k=0;k<n;k++){const o=orig[k%orig.length];base.push([o[0],o[1],Math.random()*3,0.5+Math.random()*0.6,Math.random()*6.28]);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
  const m=new T.PointsMaterial({color:cor,size:0.07,map:p3dTex('brilho'),transparent:true,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true,toneMapped:false});const pts=new T.Points(g,m);pts.frustumCulled=false;W.add(pts);
  P3D.amb.push(t=>{for(let k=0;k<n;k++){const b=base[k];const f=((t*b[3]+b[2])%3)/3;p[k*3]=b[0]+Math.sin(t*1.7+b[4])*0.12*f;p[k*3+1]=0.03+f*1.6;p[k*3+2]=b[1]+Math.cos(t*1.3+b[4])*0.08*f;}g.attributes.position.needsUpdate=true;});
  return pts;}
/* névoa rasteira: tufos grandes e transparentes que andam devagar (um Points só) */
function p3dNeblina(W,n,cor,op,tam,area){
  const T=THREE,L=P3D.L,p=new Float32Array(n*3),base=[];const rnd=p3dRng(313+P3D.arena);
  for(let k=0;k<n;k++){const x=(rnd()-0.5)*(area?area[0]:L.hwF*2.4),z=(area?area[1]:L.zB)+rnd()*(area?area[2]:(L.zF-L.zB)),y=(area?area[3]:P3D_Y0)+0.15+rnd()*0.35;base.push([x,y,z,rnd()*6.28,0.08+rnd()*0.1]);p.set([x,y,z],k*3);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));
  const m=new T.PointsMaterial({color:cor,size:tam||3.2,map:p3dTex('brilho'),transparent:true,opacity:op||0.22,depthWrite:false,sizeAttenuation:true,toneMapped:false,fog:false});
  const pts=new T.Points(g,m);pts.renderOrder=4;pts.frustumCulled=false;W.add(pts);
  P3D.amb.push(t=>{for(let k=0;k<n;k++){const b=base[k];p[k*3]=b[0]+Math.sin(t*b[4]+b[3])*0.8;p[k*3+2]=b[2]+Math.cos(t*b[4]*0.7+b[3])*0.3;}g.attributes.position.needsUpdate=true;});
  return pts;}
/* instanciados (poucas chamadas de desenho); it.sz opcional */
function p3dInst(W,geo,mat,lista,o){
  o=o||{};if(!lista.length)return null;const T=window.THREE;
  const im=new T.InstancedMesh(geo,mat,lista.length);const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),s=new T.Vector3();
  lista.forEach((it,i)=>{e.set(it.rx||0,it.ry||0,it.rz||0);q.setFromEuler(e);v.set(it.x,it.y,it.z);const s0=it.s||1;s.set(s0,(it.sy||s0),it.sz||s0);m.compose(v,q,s);im.setMatrixAt(i,m);if(it.c)im.setColorAt(i,p3dCor(it.c));});
  im.castShadow=!!o.sombra;im.receiveShadow=!!o.recebe;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;
  W.add(im);return im;
}
function p3dAgua(cor){
  const m=new THREE.MeshStandardMaterial({color:cor,roughness:0.15,metalness:0.05,transparent:true,opacity:0.92});
  m.onBeforeCompile=sh=>{sh.uniforms.uT=P3D.uT;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='uniform float uT;\nvarying vec3 vWp;\n'+sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float w1=sin(vWp.x*9.0+uT*1.8)+sin(vWp.z*11.0-uT*1.4)+sin((vWp.x+vWp.z)*6.0+uT*2.3);
      normal=normalize(normal+vec3(cos(vWp.x*6.0+uT*1.7)*0.2,sin(vWp.z*8.0-uT*1.3)*0.2,0.0));
      diffuseColor.rgb+=vec3(0.12,0.14,0.14)*smoothstep(1.6,2.4,w1);`);};
  m.customProgramCacheKey=()=>'agua';
  return m;
}
/* ---------- árvores e morros de cada região (peças locais, altura ~1 com s=1) ---------- */
const P3DA={
  mandacaru(r){return P3DB.mandacaru(1.1+r()*0.4,r()<0.5?'#4E8A4A':'#3E7A44');},
  samauma(r,cc){const G=p3dGeo(),L=[],tr='#7A6250';p3dPeca(L,G.cil,0,0.8,0,0,0,0,0.07,1.6,0.07,tr);
    for(let k=0;k<5;k++){const a=k/5*6.283+r();p3dPeca(L,G.caixa,Math.cos(a)*0.09,0.18,Math.sin(a)*0.09,0,-a,0.35,0.22,0.36,0.025,tr);}
    for(let k=0;k<3;k++){const a=k*2.1+r();p3dPeca(L,G.esf,Math.cos(a)*0.28,1.62+k*0.07,Math.sin(a)*0.22,0,0,0,0.5,0.2,0.42,cc[k%cc.length]);}
    p3dPeca(L,G.esf,0,1.78,0,0,0,0,0.42,0.18,0.38,cc[0]);return L;},
  buriti(r,cc){const G=p3dGeo(),L=[];const h=1.1+r()*0.4;p3dPeca(L,G.cil,0,h/2,0,0,0,0,0.04,h,0.04,'#6A5A48');
    for(let k=0;k<8;k++){const a=k/8*6.283+r()*0.3;p3dPeca(L,G.cone4,Math.cos(a)*0.2,h-0.02,Math.sin(a)*0.2,Math.sin(a)*1.9,0,-Math.cos(a)*1.9,0.06,0.5,0.015,cc[k%cc.length]);}
    p3dPeca(L,G.esfP,0,h,0,0,0,0,0.08,0.06,0.08,'#8A6A3A');return L;},
  seca(r,cc){const G=p3dGeo(),L=[],c=cc[0];p3dPeca(L,G.cil,0,0.5,0,0,0,(r()-0.5)*0.15,0.05,1.0,0.05,c);
    for(let k=0;k<5;k++){const a=k/5*6.283+r(),y=0.6+k*0.08,l=0.35+r()*0.25;p3dPeca(L,G.cil,Math.cos(a)*l*0.45,y+l*0.3,Math.sin(a)*l*0.45,Math.sin(a)*0.9,0,-Math.cos(a)*0.9,0.018,l,0.018,c);}
    return L;},
  copa(r,cc){const G=p3dGeo(),L=[];p3dPeca(L,G.cil,0,0.4,0,0,0,0,0.06,0.8,0.06,'#5A4030');p3dPeca(L,G.esf,0,0.95,0,0,0,0,0.42,0.36,0.42,cc[0]);p3dPeca(L,G.esf,0.18,1.12,0.05,0,0,0,0.26,0.22,0.26,cc[1%cc.length]);return L;},
  juazeiro(){const G=p3dGeo(),L=[];p3dPeca(L,G.cil,0,0.35,0,0,0,0.25,0.07,0.75,0.07,'#5A4232');p3dPeca(L,G.cil,0.12,0.75,0,0,0,-0.5,0.05,0.5,0.05,'#5A4232');
    for(const [x,y,z,s] of [[0,1.0,0,0.55],[0.35,0.95,0.1,0.38],[-0.3,0.92,-0.05,0.4],[0.1,1.12,-0.15,0.35]])p3dPeca(L,G.esf,x,y,z,0,0,0,s,s*0.55,s,'#3A6A34');return L;}
};
/* ---------- longe: mar de nuvens, ilhas distantes com árvores da região, sol/lua/névoa no céu ---------- */
function p3dLonge(W,A){
  const T=window.THREE,G=P3D.G,L=P3D.L,rnd=p3dRng(55+P3D.arena*101);
  // mar de nuvens por baixo e em volta
  const nv=[];const nn=G.cel?45:70;
  for(let k=0;k<nn;k++){const a=rnd()*6.283,d=7+Math.pow(rnd(),0.7)*48;const cx=Math.cos(a)*d*1.1,cz=L.cz+Math.sin(a)*d-6;const y=-7-rnd()*4-d*0.08;
    const n=3+Math.floor(rnd()*3),r0=1.2+rnd()*2.2;for(let j=0;j<n;j++)nv.push({x:cx+(j-n/2)*r0*0.9,y:y+(j%2)*r0*0.25,z:cz+(rnd()-0.5)*r0,s:r0*(0.7+rnd()*0.5),sy:r0*(0.45+rnd()*0.25),c:A.nuvem[Math.floor(rnd()*A.nuvem.length)]});}
  const nm=p3dMat('#FFFFFF',{rough:1,emi:'#FFFFFF',ei:0.1});
  p3dInst(W,new T.SphereGeometry(1,9,6),nm,nv);
  // ilhas distantes, com as árvores da região (tudo numa malha só)
  const partes=[];const ilhas=[];const nI=G.cel?7:10;
  for(let k=0;k<nI;k++){const lado=k%2?1:-1;const d=14+k*4.2+rnd()*4;const x=lado*(4+rnd()*d*0.55),z=L.zB-d*0.75-rnd()*4,y=-2.5-rnd()*3.5+(k<2?1:0),r0=1.6+rnd()*1.8;ilhas.push({x,y,z,r:r0});}
  const G0=p3dGeo();
  for(const I of ilhas){p3dPeca(partes,new T.CylinderGeometry(1,0.96,0.35,20),I.x,I.y,I.z,0,0,0,I.r,1,I.r,A.grama[0]);
    p3dPeca(partes,new T.ConeGeometry(0.92,1.6,14),I.x,I.y-0.175-I.r*0.8,I.z,Math.PI,0,0,I.r,I.r,I.r,A.terra[1]);
    p3dPeca(partes,new T.CylinderGeometry(0.96,0.92,0.25,20),I.x,I.y-0.3,I.z,0,0,0,I.r,1,I.r,A.terra[0]);
    const nh=1+Math.floor(rnd()*2);for(let j=0;j<nh;j++){const s=I.r*(0.35+rnd()*0.25);p3dPeca(partes,G0.meia,I.x+(rnd()-0.5)*I.r,I.y+0.17,I.z+(rnd()-0.5)*I.r*0.6,0,0,0,s,I.r*(0.25+rnd()*0.2),s,rnd()<0.5?A.grama[2]:A.grama[1]);}
    if(A.arv==='mandacaru'){for(let j=0;j<2;j++)p3dPor(partes,P3DB.pedra(j?'#8A4E3A':'#6E3E30',I.r*0.3),I.x+(rnd()-0.5)*I.r,I.y+0.12,I.z+(rnd()-0.5)*I.r*0.5,rnd()*6,1);}
    const np=2+Math.floor(rnd()*4);for(let j=0;j<np;j++){const a=rnd()*6.28,e=rnd()*0.7*I.r,s=0.6+rnd()*0.7;p3dPor(partes,P3DA[A.arv](rnd,A.copa),I.x+Math.cos(a)*e,I.y+0.17,I.z+Math.sin(a)*e*0.6,rnd()*6,s);}}
  const ilhaM=new T.Mesh(p3dJuntar(partes),p3dMat('#FFFFFF',{vc:true,rough:0.9}));W.add(ilhaM);
  P3D.ilhas=ilhas;
  // o astro: um sprite pintado lá longe (sol de fim de tarde, sol na névoa, lua; sem carinha)
  const lua=A.astro==='lua'||A.astro==='luaGrande';
  const sp=p3dAstro(A.astro,P3D.arena===5&&lua?'#FFF0D0':null);
  const sx=G.cx+Math.min(G.W*0.34,(G.campoW||G.W)*0.34),sy=Math.max(G.H*0.1,(G.yRs||G.H*0.3)-(G.yPs-G.yRs)*0.36);
  const dist=G.D*5,wpx=2*dist*Math.tan(G.fov*Math.PI/360)/G.H;
  const tam=(A.astro==='luaGrande'?1.7:A.astro==='sol'?1.55:1.2)*Math.max(64,Math.min(130,G.W*0.2))*wpx;
  const pos=(x,y)=>{P3D.ndc.set(x/G.W*2-1,-(y/G.H)*2+1);P3D.ray.setFromCamera(P3D.ndc,P3D.cam);return P3D.ray.ray.origin.clone().addScaledVector(P3D.ray.ray.direction,dist);};
  sp.position.copy(pos(sx,sy));sp.scale.set(tam,tam,1);W.add(sp);
  sp.userData.p0=sp.position.clone();sp.userData.sobe=new T.Vector3(0,-tam*0.9,0);sp.userData.lua=lua;
  P3D.astro=sp;const base=tam;P3D.amb.push(t=>{const k=1+Math.sin(t*0.9)*0.015;sp.scale.set(base*k,base*k,1);});
  if(P3D.ceu){const d=sp.position.clone().sub(P3D.ceu.position).normalize();P3D.ceu.material.uniforms.dG.value.copy(d);P3D.ceu.material.uniforms.kG.value=A.astro==='sol'?0.9:A.astro==='nevoa'?0.6:A.astro==='nuvem'?0.1:0.32;}
  // a lua da Meia-Noite (onde o céu ainda é de dia): começa escondida embaixo e sobe
  P3D.lua2=null;
  if(!lua){const l2=p3dAstro('lua');const t2=1.1*Math.max(64,Math.min(130,G.W*0.2))*wpx;l2.position.copy(pos(G.cx-Math.min(G.W*0.32,(G.campoW||G.W)*0.32),sy+G.H*0.02));l2.scale.set(t2,t2,1);
    l2.userData.p0=l2.position.clone();l2.userData.sobe=new T.Vector3(0,-t2*2.2,0);l2.visible=false;l2.material.transparent=true;W.add(l2);P3D.lua2=l2;}
  // estrelas nas arenas de noite
  if(lua||A.var==='luar'){const n=G.cel?160:220,p=new Float32Array(n*3);for(let k=0;k<n;k++){const a=rnd()*6.283,e=-0.5+rnd()*0.95,R=G.D*9;p[k*3]=Math.cos(a)*Math.cos(e)*R;p[k*3+1]=Math.sin(e)*R;p[k*3+2]=G.zR+Math.sin(a)*Math.cos(e)*R;}
    const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(p,3));const pm=new T.PointsMaterial({color:'#FFF6D8',size:2.2,map:p3dTex('brilho'),transparent:true,depthWrite:false,fog:false,blending:T.AdditiveBlending,sizeAttenuation:false,toneMapped:false});W.add(new T.Points(sg,pm));
    P3D.amb.push(t=>{pm.opacity=0.75+Math.sin(t*1.7)*0.2;});}
}
/* sol, lua ou névoa pintados num sprite (com halo) */
function p3dAstro(tipo,tinta){
  const T=THREE,S=256,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');const c=S/2;
  const halo=(r0,r1,cor,a)=>{const gr=g.createRadialGradient(c,c,r0,c,c,r1);gr.addColorStop(0,`rgba(${cor},${a})`);gr.addColorStop(1,`rgba(${cor},0)`);g.fillStyle=gr;g.fillRect(0,0,S,S);};
  if(tipo==='sol'){halo(30,128,'255,150,70',0.75);const gr=g.createRadialGradient(c,c-14,6,c,c,52);gr.addColorStop(0,'#FFF4C8');gr.addColorStop(0.6,'#FFC060');gr.addColorStop(1,'#FF7A30');g.fillStyle=gr;g.beginPath();g.arc(c,c,52,0,6.283);g.fill();
    g.fillStyle='rgba(120,40,40,.35)';for(const [y,h] of [[c+8,5],[c+22,4],[c+34,3]])g.fillRect(c-60,y,120,h);}
  else if(tipo==='nevoa'){halo(10,128,'255,250,220',0.55);halo(0,46,'255,252,235',0.9);}
  else if(tipo==='nuvem'){g.fillStyle='#3A3A52';for(const [x,y,r] of [[-50,10,46],[0,-16,58],[52,8,44],[0,26,48]]){g.beginPath();g.arc(c+x,c+y,r,0,6.283);g.fill();}g.fillStyle='rgba(200,210,255,.25)';g.beginPath();g.arc(c-6,c-34,30,3.4,6);g.fill();}
  else{halo(40,128,'200,215,255',0.55);const gr=g.createRadialGradient(c-16,c-18,8,c,c,58);gr.addColorStop(0,'#FFFDF0');gr.addColorStop(1,'#E2DCC8');g.fillStyle=gr;g.beginPath();g.arc(c,c,58,0,6.283);g.fill();
    g.fillStyle='rgba(150,140,130,.35)';for(const [x,y,r] of [[-22,-16,12],[20,14,9],[14,-26,7],[-8,22,10],[30,-4,6]]){g.beginPath();g.arc(c+x,c+y,r,0,6.283);g.fill();}}
  const st=p3dCanvasTex(cv);
  const sp=new T.Sprite(new T.SpriteMaterial({map:st,color:tinta||'#FFFFFF',fog:false,toneMapped:false,depthWrite:false,depthTest:true,transparent:true}));sp.renderOrder=-5;return sp;
}
/* ---------- enfeites por arena (na ilha e nas ilhas distantes) ---------- */
function p3dProps(W,A){
  const T=window.THREE,G=P3D.G,L=P3D.L,rnd=p3dRng(777+P3D.arena*31),G0=p3dGeo();
  const bx=L.hwB;
  const Y=(x,z)=>p3dPe(x,z);
  const S=[],E=[],V=[]; // parado (sombra), brilho (sem luz), planta que balança
  const ponha=(parts,x,z,ry,s,y,dst)=>p3dPor(dst||S,parts,x,y==null?Y(x,z):y,z,ry||0,s||1);
  const I=P3D.ilhas,naIlha=(k,parts,dx,dz,s,ry,dst)=>{const q=I[k%I.length];return ponha(parts,q.x+(dx||0)*q.r,q.z+(dz||0)*q.r,ry||0,s||1,q.y+0.17,dst);};
  const mats={};const M=(c,o)=>{const k=c+JSON.stringify(o||{});return mats[k]||(mats[k]=p3dMat(c,o));};
  const mesh=(g,m,x,y,z,rx,ry,rz)=>{const o=new T.Mesh(g,m);o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,ry||0,rz||0);return o;};
  const xC=sd=>sd*(L.hw(L.zB+0.75)-0.55),zC=L.zB+0.75;
  const zRv=L.zRio;
  // ---- construções (peças) ----
  const porteira=()=>{const L2=[],c='#6A4A30',c2='#7E5A3A';for(const sd of [-1,1])p3dPeca(L2,G0.caixa,sd*0.75,0.6,0,0,0,0,0.14,1.2,0.14,c);
    for(const y of [0.35,0.62,0.89])p3dPeca(L2,G0.caixa,0,y,0,0,0,0,1.4,0.08,0.06,c2);p3dPeca(L2,G0.caixa,0,0.62,0.01,0,0,0.42,1.55,0.08,0.05,c2);
    for(const sd of [-1,1])for(let k=1;k<=3;k++){p3dPeca(L2,G0.caixa,sd*(0.75+k*0.45),0.3,0,0,0,(rnd()-0.5)*0.15,0.08,0.6,0.08,c);p3dPeca(L2,G0.caixa,sd*(0.75+k*0.45-0.22),0.42,0,0,0,0,0.45,0.05,0.04,c2);}
    p3dPeca(L2,G0.esf,-0.75,1.25,0,0,0,0,0.11,0.08,0.11,'#E8DDC8');return L2;};// a caveira de boi virou só um pote de barro no mourão
  const roda=()=>{const L2=[];p3dPeca(L2,G0.anel,0,0.36,0,0,0,0,0.36,0.36,0.6,'#7A5236');for(let k=0;k<6;k++)p3dPeca(L2,G0.caixa,0,0.36,0,0,0,k/6*Math.PI,0.04,0.68,0.03,'#6A4428');
    p3dPeca(L2,G0.cil,0,0.36,0,Math.PI/2,0,0,0.07,0.12,0.07,'#4A3020');return L2;};
  const palafita=()=>{const L2=[];for(const [x,z] of [[-0.45,-0.35],[0.45,-0.35],[-0.45,0.35],[0.45,0.35]])p3dPeca(L2,G0.cil,x,0.35,z,0,0,0,0.04,0.9,0.04,'#5A4030');
    p3dPeca(L2,G0.caixa,0,0.62,0,0,0,0,1.15,0.06,0.95,'#7A5A3A');p3dPeca(L2,G0.caixa,0,0.92,0,0,0,0,0.85,0.55,0.7,'#8A6A44');
    p3dPeca(L2,G0.cone4,0,1.42,0,0,Math.PI/4,0,0.78,0.5,0.66,'#A8884A');p3dPeca(L2,G0.caixa,0,0.86,0.355,0,0,0,0.24,0.3,0.02,'#3A2414');return L2;};
  const canoa=()=>{const L2=[];p3dPeca(L2,G0.esf,0,0.03,0,0,0,0,0.5,0.1,0.13,'#6A4428');p3dPeca(L2,G0.esf,0,0.06,0,0,0,0,0.44,0.05,0.1,'#3A2414');p3dPeca(L2,G0.caixa,0.15,0.08,0.05,0,0.3,0.4,0.03,0.5,0.03,'#8A6A44');return L2;};
  const tapera=()=>{const L2=[],tp='#9A8468';p3dPeca(L2,G0.caixa,0,0.45,0,0,0,0,1.5,0.9,1.0,tp);p3dPeca(L2,G0.caixa,0,0.05,0,0,0,0,1.56,0.1,1.06,'#6A5A48');
    p3dPeca(L2,G0.caixa,-0.3,0.35,0.505,0,0,0,0.3,0.6,0.02,'#1E1620');p3dPeca(L2,G0.caixa,0.38,0.55,0.505,0,0,0,0.26,0.24,0.02,'#1E1620');
    p3dPeca(L2,G0.caixa,-0.36,1.08,0,0,0,0.5,0.95,0.06,1.2,'#5A4636');p3dPeca(L2,G0.caixa,0.32,1.0,0.15,0,0.1,-0.62,0.7,0.06,0.8,'#4E3C2E');
    p3dPeca(L2,G0.caixa,0.05,1.25,0,0,0,0,0.06,0.06,1.3,'#3A2C22');for(let k=0;k<4;k++)p3dPeca(L2,G0.caixa,0.35+k*0.07,1.02-k*0.06,-0.35,0,0,-0.62,0.04,0.04,0.5,'#3A2C22');return L2;};
  const cercaTorta=(n)=>{const L2=[];for(let k=0;k<n;k++){p3dPeca(L2,G0.caixa,k*0.42,0.28,0,(rnd()-0.5)*0.2,0,(rnd()-0.5)*0.4,0.07,0.56+rnd()*0.15,0.07,'#4A3E44');
      if(k<n-1&&rnd()<0.8)p3dPeca(L2,G0.caixa,k*0.42+0.21,0.3+(rnd()-0.5)*0.08,0,0,0,(rnd()-0.5)*0.3,0.44,0.05,0.04,'#3E3438');}return L2;};
  const ipeSeco=()=>{const L2=P3DA.seca(rnd,['#3E3434']);for(let k=0;k<3;k++){const a=k*2.2;p3dPeca(L2,G0.cil,Math.cos(a)*0.3,0.95+k*0.1,Math.sin(a)*0.25,Math.sin(a)*0.9,0,-Math.cos(a)*0.9,0.015,0.5,0.015,'#3E3434');}
    p3dPeca(L2,G0.esf,0.18,1.02,0.02,0,0,0,0.09,0.12,0.08,'#6A5A4A');p3dPeca(L2,G0.esf,0.18,1.16,0.03,0,0,0,0.08,0.07,0.07,'#7A6A58');return L2;};
  const poste=()=>{const L2=[];p3dPeca(L2,G0.cil,0,0.9,0,0,0,0,0.04,1.8,0.04,'#2A2230');p3dPeca(L2,G0.caixa,0.15,1.78,0,0,0,0,0.34,0.04,0.04,'#2A2230');
    p3dPeca(L2,G0.cone4,0.3,1.7,0,Math.PI,Math.PI/4,0,0.1,0.08,0.1,'#2A2230');return L2;};
  const coreto=()=>{const L2=[];p3dPeca(L2,new T.CylinderGeometry(1,1,1,8),0,0.12,0,0,0,0,1.0,0.24,1.0,'#E8DCC8');for(let k=0;k<8;k++){const a=k/8*6.283;p3dPeca(L2,G0.cil,Math.cos(a)*0.85,0.75,Math.sin(a)*0.85,0,0,0,0.04,1.1,0.04,'#F4EEE0');}
    p3dPeca(L2,new T.ConeGeometry(1,1,8),0,1.55,0,0,0,0,1.15,0.6,1.15,'#B83A2E');p3dPeca(L2,G0.esfP,0,1.9,0,0,0,0,0.08,0.08,0.08,'#F2C230');return L2;};
  const barraca=(c1,c2)=>{const L2=[];p3dPeca(L2,G0.caixa,0,0.3,0,0,0,0,1.0,0.6,0.5,'#7A5236');for(const sd of [-1,1])p3dPeca(L2,G0.cil,sd*0.48,0.65,0.22,0,0,0,0.03,1.3,0.03,'#5A3A22');
    for(let k=0;k<5;k++)p3dPeca(L2,G0.caixa,-0.4+k*0.2,1.25,0.08,0.35,0,0,0.2,0.04,0.65,k%2?c1:c2);p3dPeca(L2,G0.esf,-0.2,0.66,0,0,0,0,0.1,0.07,0.1,'#E8A030');p3dPeca(L2,G0.esf,0.15,0.66,0.05,0,0,0,0.09,0.07,0.09,'#C8402E');return L2;};
  const estandarte=(cor)=>{const L2=[];p3dPeca(L2,G0.cil,0,0.8,0,0,0,0,0.025,1.6,0.025,'#5A3A22');p3dPeca(L2,G0.caixa,0.13,1.3,0,0,0,0,0.24,0.55,0.015,cor);p3dPeca(L2,G0.tri,0.13,1.03,0,0,0,0,0.24,0.14,1,cor);p3dPeca(L2,G0.esfP,0,1.62,0,0,0,0,0.04,0.04,0.04,'#F2C230');return L2;};
  const arbusto=(x,z,s,cores)=>{const y=Y(x,z);for(let j=0;j<3;j++)p3dPeca(S,G0.ico,x+(j-1)*0.2*s,y+0.12*s,z+(j%2)*0.08*s,0,0,0,s*(0.22+(j===1?0.08:0)),s*(0.2+(j===1?0.08:0)),s*(0.22+(j===1?0.08:0)),cores[j%cores.length]);};
  const pedras=(n,c)=>{for(let k=0;k<n;k++){const x=-bx+0.6+rnd()*(2*bx-1.2),z=L.zB+0.3+rnd()*0.4;ponha(P3DB.pedra(c,0.12+rnd()*0.12),x,z,rnd()*6,1);}};
  // ---- coisas animadas (cada uma é pouca coisa) ----
  const fogueira=(x,z,yy,esc)=>{esc=esc||1;const g=new T.Group();for(let k=0;k<6;k++){const a=k/6*6.28;g.add(mesh(new T.CylinderGeometry(0.06,0.07,0.8,6),M('#5A3A22'),Math.cos(a)*0.18,0.15,Math.sin(a)*0.18,Math.sin(a)*1.1,0,Math.cos(a)*1.1));}
    for(let k=0;k<8;k++){const a=k/8*6.28;g.add(mesh(new T.DodecahedronGeometry(0.12,0),M('#6E6458',{flat:true}),Math.cos(a)*0.48,0.06,Math.sin(a)*0.48));}
    const fm=[M('#FF7A2A',{emi:'#FF6A1A',ei:1.8,liso:true}),M('#FFD040',{emi:'#FFC020',ei:2,liso:true})];const ch=[];
    for(let k=0;k<4;k++){const c=mesh(new T.ConeGeometry(0.2-k*0.03,0.7-k*0.08,8),fm[k%2],(k%2?0.06:-0.05)*(k>1?-1:1),0.4,(k-1.5)*0.04);c.castShadow=false;g.add(c);ch.push(c);}
    g.position.set(x,yy==null?Y(x,z):yy,z);g.scale.setScalar(esc);W.add(g);
    const pl=new T.PointLight(0xFF9A40,1.6,16,1.5);pl.position.set(x,(yy==null?Y(x,z):yy)+1.1*esc,z);W.add(pl);
    p3dBrasas(W,[[x,z]],'#FFB040',18).position.y=(yy==null?Y(x,z):yy);
    P3D.amb.push(t=>{ch.forEach((c,i)=>{c.scale.set(1+Math.sin(t*9+i)*0.08,1+Math.sin(t*7.3+i*2)*0.18,1);c.rotation.y=t*(i%2?1.2:-1);});pl.intensity=1.5+Math.sin(t*11)*0.15+Math.sin(t*17)*0.1;});};
  const nuvens=(n,cor,ei)=>{const cm=p3dMat(cor,{rough:1,emi:cor,ei:ei==null?0.15:ei});
    for(let k=0;k<n;k++){const g=new T.Group();for(let j=0;j<5;j++){const s=new T.Mesh(new T.IcosahedronGeometry(1,2),cm);s.position.set((j-2)*1.0+(rnd()-0.5)*0.4,(j===1||j===2?0.55:0)+rnd()*0.3,rnd()*0.4);s.scale.set(0.85+rnd()*0.7,0.5+rnd()*0.3,0.8);g.add(s);}
      const x0=(rnd()-0.5)*50,z=L.zB-12-rnd()*30,y=-1.5+rnd()*4;g.position.set(x0,y,z);g.scale.setScalar(0.9+rnd()*0.9);W.add(g);
      const v=0.2+rnd()*0.3,span=70;P3D.amb.push(t=>{g.position.x=((x0+t*v+span/2)%span+span)%span-span/2;});}};
  const vagalumes=(n,cor)=>{const geo=new T.BufferGeometry(),p=new Float32Array(n*3),base=[];for(let k=0;k<n;k++){const x=(rnd()-0.5)*14,z=G.zR-2+rnd()*(G.zP-G.zR+4),y=0.4+rnd()*1.6;base.push([x,y,z,rnd()*6.28]);p.set([x,y,z],k*3);}
    geo.setAttribute('position',new T.BufferAttribute(p,3));const pm=new T.PointsMaterial({color:cor,size:0.24,map:p3dTex('brilho'),transparent:true,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true,toneMapped:false});
    const pts=new T.Points(geo,pm);W.add(pts);P3D.amb.push(t=>{for(let k=0;k<n;k++){const b=base[k];p[k*3]=b[0]+Math.sin(t*0.4+b[3])*0.6;p[k*3+1]=b[1]+Math.sin(t*0.9+b[3]*2)*0.3;p[k*3+2]=b[2]+Math.cos(t*0.35+b[3])*0.5;}geo.attributes.position.needsUpdate=true;pm.opacity=0.75+Math.sin(t*2.3)*0.25;});};
  const chuva=()=>{const n=G.cel?160:240,geo=new T.BufferGeometry(),p=new Float32Array(n*6),base=[];for(let k=0;k<n;k++)base.push([(rnd()-0.5)*18,rnd()*9,G.zR-4+rnd()*(G.zP-G.zR+8),4+rnd()*3]);
    geo.setAttribute('position',new T.BufferAttribute(p,3));const lm=new T.LineBasicMaterial({color:'#B8C8D8',transparent:true,opacity:0.4,depthWrite:false});const ls=new T.LineSegments(geo,lm);ls.frustumCulled=false;W.add(ls);
    P3D.amb.push((t)=>{for(let k=0;k<n;k++){const b=base[k];const y=9-((b[1]+t*b[3]*2.2)%9);p.set([b[0],y,b[2],b[0]+0.06,y+0.38,b[2]],k*6);}geo.attributes.position.needsUpdate=true;});};
  const abelhas=(cx,cz)=>{const bm=M('#E8B030',{rough:0.5}),list=[];for(let k=0;k<4;k++){const b=mesh(new T.SphereGeometry(0.05,8,6),bm);b.scale.set(1.3,1,1);W.add(b);list.push(b);}
    P3D.amb.push(t=>{list.forEach((b,i)=>{const a=t*(1.2+i*0.2)+i*1.3,r=0.5+i*0.12;b.position.set(cx+Math.cos(a)*r,Y(cx,cz)+0.6+Math.sin(t*3+i)*0.15,cz+Math.sin(a)*r*0.7);b.rotation.y=-a;});});};
  const feixes=(n,cor)=>{const fm=new T.MeshBasicMaterial({map:p3dTex('feixe'),color:cor,transparent:true,opacity:0.16,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false,fog:false});
    for(let k=0;k<n;k++){const m=new T.Mesh(new T.CylinderGeometry(0.35,0.9,9,12,1,true),fm);const x=-bx*0.9+k*(bx*1.8/Math.max(1,n-1))+(rnd()-0.5);m.scale.set(0.7,0.55,0.7);m.position.set(x,2.2,L.zB-1.5-rnd()*2.5);m.rotation.z=0.3;m.renderOrder=5;W.add(m);}
    P3D.amb.push(t=>{fm.opacity=0.13+Math.sin(t*0.7)*0.04;});};
  const brilho=(x,y,z,s,cor)=>p3dPeca(E,G0.esfP,x,y,z,0,0,0,s,s,s,cor);
  const tipo=A.props;
  const arv=(x,z,s)=>ponha(P3DA[A.arv](rnd,A.copa),x,z,rnd()*6,s);
  // ---- cada arena ----
  if(tipo==='sertao'){
    ponha(porteira(),xC(-1)+0.2,zC-0.05,0.15,0.62);
    ponha(P3DA.juazeiro(),xC(1),zC,rnd()*6,0.9);
    for(const sd of [-1,1]){arbusto(sd*(L.borda(zRv-L.rioW-0.45)-0.35),zRv-L.rioW-0.45,1,['#6E7A3A','#7E8A44']);ponha(P3DB.mandacaru(0.9),sd*(L.borda(L.r.zf+0.25)-0.3),L.r.zf+0.25,rnd()*6,0.9);
      ponha(P3DB.xique(),sd*(L.borda(L.p.zf-0.2)-0.3),L.p.zf-0.2,rnd()*6,1.4);}
    {const x=L.borda(zRv+L.rioW+0.45)-0.4,z=zRv+L.rioW+0.45;p3dPor(S,roda(),x,Y(x,z)+0.02,z,0.6,0.75);
      ponha(P3DB.pedra('#8A4E3A',0.16),x+0.25,z-0.1,0,1);}
    pedras(3,'#8A4E3A');
    for(let k=0;k<4;k++)naIlha(k,[...P3DB.pedra('#7A4434',1.1),...P3DB.pedra('#8E5240',0.8).map(p=>({g:p.g,m:p3dM4(0.9,0,0.2).multiply(p.m),c:p.c}))],0.2,-0.2,1,rnd()*6);
    naIlha(0,porteira(),0,0.3,0.7,0.3);
    nuvens(5,'#E8906A',0.25);
    p3dBrasas(W,Array.from({length:10},()=>[(rnd()-0.5)*bx*2,L.zB+rnd()*(L.zF-L.zB)]),'#FF9A40',28);
    p3dNeblina(W,10,'#FFB080',0.08,4);
  }else if(tipo==='mata'){
    for(const sd of [-1,1]){ponha(P3DA.samauma(rnd,A.copa),xC(sd),zC,rnd()*6,0.8);ponha(P3DB.bromelia(),xC(sd)-sd*0.6,zC+0.3,0,1.6);}
    for(const sd of [-1,1]){arbusto(sd*(L.borda(zRv-L.rioW-0.45)-0.35),zRv-L.rioW-0.45,1.1,['#2E6A30','#3E7E36']);ponha(P3DB.samambaia('#3E8E3A'),sd*(L.borda(zRv+L.rioW+0.4)-0.3),zRv+L.rioW+0.4,0,2.2,null,V);
      ponha(P3DB.samambaia('#2E7A34'),sd*(L.borda(L.p.zf-0.2)-0.25),L.p.zf-0.2,0,2,null,V);}
    {const x=-(L.hw(L.r.zb)-0.45),z=L.r.zb+0.4;ponha(P3DB.tronco('#6A4428'),x,z,0.3,2.2);abelhas(x,z);}
    // cipós pendurados entre as árvores do fundo
    for(const sd of [-1,1]){const a=new T.Vector3(xC(sd),Y(xC(sd),zC)+1.3,zC),b=new T.Vector3(sd*0.6,Y(0,zC)+1.6,zC-0.6),m=a.clone().lerp(b,0.5);m.y-=0.6;
      S.push({g:new T.TubeGeometry(new T.QuadraticBezierCurve3(a,m,b),16,0.025,5),c:'#4E6A2A'});}
    for(let k=0;k<5;k++)naIlha(k,P3DA.samauma(rnd,A.copa),(rnd()-0.5)*0.6,0,1.4,rnd()*6);
    feixes(G.cel?3:4,'#FFF2C0');vagalumes(22,'#E8FFA0');nuvens(4,'#C8DCC0',0.2);
    p3dNeblina(W,12,'#A8C4A8',0.07,3.6);
  }else if(tipo==='igapo'){
    for(const sd of [-1,1])ponha(P3DA.buriti(rnd,A.copa),xC(sd),zC,rnd()*6,0.85);
    for(const sd of [-1,1]){ponha(P3DB.taboa(0.8),sd*(L.borda(zRv-L.rioW-0.3)-0.3),zRv-L.rioW-0.3,0,1.2,null,V);ponha(P3DB.taboa(0.7),sd*(L.borda(zRv+L.rioW+0.3)-0.25),zRv+L.rioW+0.3,0,1.1,null,V);}
    {const x=L.borda(zRv)*0.45;p3dPor(S,canoa(),x,P3D_Y0+0.02,zRv+0.02,0.15,1);}
    for(let k=0;k<7;k++){const x=(rnd()<0.5?-1:1)*(0.8+rnd()*(L.borda(zRv)-1.1)),z=zRv+(rnd()-0.5)*L.rioW*1.2;p3dPor(S,P3DB.vitoria(0.09+rnd()*0.05),x,P3D_Y0+0.008,z,rnd()*6,1);if(k%3===0)p3dPor(S,P3DB.florAgua(),x,P3D_Y0+0.01,z,0,1);}
    naIlha(0,palafita(),0,0,0.9,0.4);{const q=I[0];brilho(q.x,q.y+0.17+0.86*0.9,q.z+0.33*0.9,0.11,'#FFC860');p3dPontos(W,[[q.x,q.y+0.17+0.86*0.9,q.z+0.4]],'#FFB040',1.6,0.9);}
    for(let k=1;k<6;k++)naIlha(k,P3DA.buriti(rnd,A.copa),(rnd()-0.5)*0.6,0,1.3,rnd()*6);
    vagalumes(26,'#B8FFE0');
    p3dNeblina(W,20,'#7EA0B8',0.15,4.2);
  }else if(tipo==='tapera'){
    ponha(tapera(),xC(-1)+0.15,zC-0.1,0.35,0.55);
    ponha(ipeSeco(),xC(1),zC,0.4,1.25);{const x=xC(1),z=zC,y=Y(x,z);const ry=0.4,k=1.25;const ox=0.18*k,oz=0.02*k;const cx=x+Math.cos(ry)*ox+Math.sin(ry)*oz,cz=z-Math.sin(ry)*ox+Math.cos(ry)*oz;
      for(const sd of [-1,1])brilho(cx+sd*0.035*k,y+1.17*k,cz+0.07*k,0.022*k,'#FFC23A');P3D.coruja=[cx,y+1.17*k,cz];}
    ponha(cercaTorta(5),-bx+0.5,L.zB+0.35,0.05,1);ponha(cercaTorta(4),0.9,L.zB+0.3,-0.08,1);
    {const x=L.borda(L.r.zf+0.35)-0.35,z=L.r.zf+0.35;ponha(poste(),x,z,Math.PI,0.62);const y=Y(x,z)+1.7*0.62;brilho(x-0.3*0.62,y,z,0.06,'#FFE6A8');p3dPontos(W,[[x-0.3*0.62,y-0.02,z]],'#FFD890',1.2,0.9);}
    for(const sd of [-1,1])arbusto(sd*(L.borda(zRv-L.rioW-0.45)-0.35),zRv-L.rioW-0.45,1,['#46523A','#56603F']);
    pedras(4,'#5A5470');
    for(let k=0;k<5;k++)naIlha(k,P3DA.seca(rnd,A.copa),(rnd()-0.5)*0.6,0,1.5,rnd()*6);naIlha(1,tapera(),0.2,0,0.6,-0.3);
    nuvens(6,'#3A3270',0.1);
    p3dNeblina(W,24,'#9A88E0',0.2,4.2);
  }else{ // arraial
    // bandeirinhas cruzadas sobre o fundo
    const yA=Y(0,zC),hp=1.35,cores=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230','#E0565B'];
    const ps=[[xC(-1),zC-0.1],[xC(1),zC-0.1],[xC(-1)*0.55,L.zB+0.25],[xC(1)*0.55,L.zB+0.25]];
    for(const [x,z] of ps)ponha(P3DB.mastro(hp,'#5A3A22'),x,z,0,1);
    p3dBandeiras(S,ps[0][0],yA+hp,ps[0][1],ps[3][0],yA+hp,ps[3][1],14,cores,0.35,0.13);p3dBandeiras(S,ps[1][0],yA+hp,ps[1][1],ps[2][0],yA+hp,ps[2][1],14,cores,0.35,0.13);
    p3dBandeiras(S,ps[0][0],yA+hp*0.92,ps[0][1],ps[1][0],yA+hp*0.92,ps[1][1],18,cores,0.45,0.12);
    const lant=[];for(let k=1;k<6;k++){const f=k/6,x=ps[0][0]+(ps[1][0]-ps[0][0])*f,y=yA+hp*0.92-Math.sin(f*Math.PI)*0.45-0.2;brilho(x,y,ps[0][1],0.07,k%2?'#FFC860':'#FF8A4A');lant.push([x,y,ps[0][1]]);}
    p3dPontos(W,lant,'#FFB060',0.9,0.8);
    for(const [sd,c] of [[-1,'#E8862E'],[1,'#7B5BD6']])ponha(estandarte(c),sd*(L.borda(L.r.zf+0.3)-0.3),L.r.zf+0.3,sd>0?Math.PI:0,0.9);
    for(const [sd,c] of [[-1,'#3FA34D'],[1,'#2E9FB5']])ponha(estandarte(c),sd*(L.borda(L.p.zb+0.15)-0.3),L.p.zb+0.15,sd>0?Math.PI:0,0.85);
    naIlha(0,coreto(),0,0,0.9,0.3);naIlha(1,barraca('#E0565B','#F4E8D0'),0,0,0.9,-0.3);naIlha(2,barraca('#2E9FB5','#F4E8D0'),0,0,0.9,0.4);
    for(let k=3;k<6;k++)naIlha(k,P3DA.copa(rnd,A.copa),(rnd()-0.5)*0.6,0,1.3,rnd()*6);
    {const q=I[1];fogueira(q.x+q.r*0.5,q.z,q.y+0.17,1.2);}
    {const x=xC(1)*0.15,z=L.zB+0.32;fogueira(x,z,null,0.55);}
    vagalumes(30,'#FFE8A0');nuvens(3,'#5A3A6A',0.12);
    p3dNeblina(W,8,'#C08AA0',0.07,4);
  }
  if(A.chuva)chuva();
  P3D.raio=!!A.raio;if(P3D.raio)P3D.raioT=performance.now()+3000;
  if(A.neblina)p3dNeblina(W,16*A.neblina,'#A898E8',0.18,4.4);
  if(A.vagalumes)vagalumes(A.vagalumes,'#C8FFE0');
  if(A.brasas)p3dBrasas(W,Array.from({length:14},()=>[(rnd()-0.5)*bx*2,L.zB+rnd()*(L.zF-L.zB)]),'#FF7A30',40);
  // tudo que é parado vira uma malha só (e os brilhos, outra)
  if(S.length){const m=new T.Mesh(p3dJuntar(S),p3dMat('#FFFFFF',{vc:true,rough:0.85}));m.castShadow=true;m.receiveShadow=true;W.add(m);}
  if(V.length){const m=new T.Mesh(p3dJuntar(V),p3dBalanco(p3dMat('#FFFFFF',{vc:true,rough:0.8}),0.06,'vert'));m.castShadow=true;W.add(m);}
  if(E.length){const m=new T.Mesh(p3dJuntar(E),new T.MeshBasicMaterial({vertexColors:true,toneMapped:false}));W.add(m);}
}
/* ---------- os heróis atrás das suas filas: busto 3D (window.CHAR3D, m3d-g.js) ou uma plaquinha com o retrato ---------- */
function p3dPlaquinha(id){
  const T=window.THREE;const cv=document.createElement('canvas');cv.width=cv.height=128;const g=cv.getContext('2d');
  const a=document.createElement('canvas');a.width=a.height=108;try{medalhaoPintar(a.getContext('2d'),id,{});}catch(e){}
  g.fillStyle='#6A4A30';p3dRR(g,0,0,128,128,22);g.fill();
  g.save();p3dRR(g,10,10,108,108,14);g.clip();g.drawImage(a,10,10);g.restore();
  g.lineWidth=5;g.strokeStyle='#3A2216';p3dRR(g,10,10,108,108,14);g.stroke();
  const tex=p3dCanvasTex(cv);
  const mad=p3dMat('#6A4A30',{rough:0.8}),esc=p3dMat('#3E2A1C',{rough:0.85}),fr=p3dMat('#FFFFFF',{map:tex,rough:0.7});
  const root=new T.Group(),corpo=new T.Group();root.add(corpo);
  const placa=new T.Mesh(new T.BoxGeometry(0.66,0.66,0.06),[mad,mad,mad,mad,fr,fr]);placa.position.y=0.62;corpo.add(placa);
  const haste=new T.Mesh(new T.CylinderGeometry(0.035,0.045,0.32,8),esc);haste.position.y=0.15;root.add(haste);
  const base=new T.Mesh(new T.CylinderGeometry(0.2,0.24,0.07,18),esc);base.position.y=0.035;root.add(base);
  root.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  return {obj:root,fb:true,wid:0.7,anim(st,t,p){let y=0.62+Math.sin(t*1.8)*0.02,rz=Math.sin(t*1.1)*0.04,rx=0;if(st==='hit'){const k=1-p;rz=Math.sin(p*24)*0.25*k;rx=-0.25*k;}placa.position.y=y;placa.rotation.set(rx,0,rz);}};
}
function p3dHerois(W,A){
  const T=window.THREE,L=P3D.L;P3D.herois=[];
  for(const P of ['r','p']){
    let id='';try{id=P==='r'?RIVAIS[B.rival].retrato:retratoId('voce');}catch(e){id='';}
    let inst=null;const f=window.CHAR3D&&window.CHAR3D[id];
    if(typeof f==='function'){try{inst=p3dModelo(id);if(inst&&inst.fb)inst=null;}catch(e){inst=null;}}
    if(!inst)inst=p3dPlaquinha(id);
    const o=inst.obj;p3dToonTudo(o);
    let h=1;try{o.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(o);h=Math.max(0.3,bb.max.y-bb.min.y);}catch(e){}
    const alvo=(inst.fb?0.95:1.05)*(P==='r'?1:0.8);o.scale.multiplyScalar(alvo/h);o.traverse(m=>{if(m.isMesh)m.castShadow=false;});
    const z=P==='r'?L.r.zb-0.7:L.p.zf+0.85,x=0;o.position.set(x,P3D_Y0,z);o.rotation.y=P==='r'?0:Math.PI;
    {const sb=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:p3dTex('brilho'),color:'#000000',transparent:true,opacity:0.4,depthWrite:false,toneMapped:false,fog:false}));sb.rotation.x=-Math.PI/2;sb.position.set(x,P3D_Y0+0.01,z);sb.scale.set(1.1,0.8,1);sb.renderOrder=1;W.add(sb);}
    W.add(o);const H={P,inst,o,hp:B?B.sides[P].hp:0,hitT:-9,off:P==='r'?0.7:0};P3D.herois.push(H);
  }
}
function p3dHeroisQuadro(t,now){
  if(!P3D.herois||!B)return;
  for(const H of P3D.herois){const hp=B.sides[H.P].hp;if(hp<H.hp)H.hitT=now;H.hp=hp;
    if(!H.inst.anim||H.ruim)continue;const k=(now-H.hitT)/520;
    try{if(k>=0&&k<1&&!RM)H.inst.anim('hit',t+H.off,k);else H.inst.anim('idle',RM?0:t+H.off,0);}catch(e){H.ruim=true;}}
}
/* anéis no chão de cada lugar: alvo (dourado), mira (vermelho), aura da família (cor da família), lugar vazio (tracejado) */
function p3dMarcas(W){
  const T=window.THREE,L=P3D.L;
  // moldura que acende em volta da placa inteira quando ela é um alvo (fica legível em qualquer cor de terreno)
  const moldura=t=>{const f=(e)=>{const hx=t.w/2+e,hz=t.d/2+e,r=t.rr+e,s=new T.Path();s.moveTo(-hx+r,-hz);s.lineTo(hx-r,-hz);s.quadraticCurveTo(hx,-hz,hx,-hz+r);s.lineTo(hx,hz-r);s.quadraticCurveTo(hx,hz,hx-r,hz);s.lineTo(-hx+r,hz);s.quadraticCurveTo(-hx,hz,-hx,hz-r);s.lineTo(-hx,-hz+r);s.quadraticCurveTo(-hx,-hz,-hx+r,-hz);return s;};
    const sh=new T.Shape(f(0.13).getPoints(8));sh.holes.push(new T.Path(f(0.035).getPoints(8).reverse()));const g=new T.ShapeGeometry(sh);g.rotateX(Math.PI/2);return g;};
  for(const s of P3D.spots){
    const t=L&&L.tiles.find(q=>q.s===s);
    const r=Math.min(0.95,(t?t.w:s.w)*0.42);const g=new T.Group();g.position.set(s.x,0.02,s.z);
    const mk=(tex,cor,op,add)=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:p3dTex(tex),color:cor,transparent:true,opacity:op,depthWrite:false,blending:add?T.AdditiveBlending:T.NormalBlending,toneMapped:false,fog:false}));m.rotation.x=-Math.PI/2;m.renderOrder=2;g.add(m);return m;};
    const vazio=mk('tracejado','#FFFFFF',0.38);vazio.scale.set(r*2.1,r*1.7,1);
    const sombra=mk('anel','#2A1406',0.5);sombra.scale.set(r*2.75,r*2.25,1);
    const alvo=mk('anel','#FFE070',1);alvo.scale.set(r*2.6,r*2.1,1);
    const alvo2=mk('brilho','#FFC040',0.5,true);alvo2.scale.set(r*3,r*2.4,1);
    const aura=mk('anel','#7FE0FF',0.9,false); // v11: sem somar luz (estourava em branco)aura.scale.set(r*2.4,r*1.95,1);
    let mold=null;
    if(t){mold=new T.Mesh(moldura(t),new T.MeshBasicMaterial({color:'#FFE070',transparent:true,opacity:0.9,depthWrite:false,toneMapped:false,fog:false,side:T.DoubleSide}));mold.position.set(t.cx-s.x,0.0,t.cz-s.z);mold.renderOrder=3;g.add(mold);}
    W.add(g);s.m={g,vazio,sombra,alvo,alvo2,aura,mold,r};
  }
}
function p3dMarcasQuadro(t){
  for(const s of P3D.spots){if(!s.m)continue;const ln=document.getElementById('ln-'+s.P+'-'+s.i);if(!ln)continue;
    const tgt=ln.classList.contains('tgt'),mira=ln.classList.contains('mira'),cheio=ln.classList.contains('has-c')||ln.classList.contains('has-b');
    const {vazio,sombra,alvo,alvo2,aura,mold,r}=s.m;
    vazio.visible=!cheio&&!tgt;
    alvo.visible=alvo2.visible=sombra.visible=tgt;if(mold)mold.visible=tgt;
    if(tgt){const w=RM?0:Math.sin(t*6);const k=1+w*0.08;const c=mira?'#FF6A4A':'#FFE070';alvo.material.color.set(c);alvo2.material.color.set(mira?'#FF5A3A':'#FFB030');alvo.scale.set(r*2.6*k,r*2.1*k,1);sombra.scale.set(r*2.75*k,r*2.25*k,1);alvo2.material.opacity=0.4+w*0.12;
      if(mold){mold.material.color.set(c);mold.material.opacity=0.75+w*0.22;}}
    const ac=ln.classList.contains('com-aura')?ln.style.getPropertyValue('--ac'):'';
    aura.visible=!!ac&&cheio;
    if(aura.visible){if(aura.userData.c!==ac){aura.userData.c=ac;try{aura.material.color.set(ac.trim());}catch(e){}}const k=RM?1:1+Math.sin(t*3.2)*0.06;aura.scale.set(r*2.4*k,r*1.95*k,1);aura.material.opacity=ln.classList.contains('fam2')?0.85:0.6;}
  }
}

/* ---------- partículas 3D (sólidas e de luz) ---------- */
function p3dParticulas(W){
  const T=window.THREE,N=160;
  const mk=(mat)=>{const im=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),mat,N);im.frustumCulled=false;im.instanceMatrix.setUsage(T.DynamicDrawUsage);const z=new T.Matrix4().makeScale(0,0,0);for(let i=0;i<N;i++){im.setMatrixAt(i,z);im.setColorAt(i,new T.Color(1,1,1));}W.add(im);return im;};
  P3D.partS=mk(new T.MeshStandardMaterial({roughness:0.6}));
  P3D.partG=mk(new T.MeshBasicMaterial({transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));
  P3D.parts=[];P3D.pi={s:0,g:0};P3D.pm=new T.Matrix4();P3D.pc=new T.Color();P3D.pq=new T.Quaternion();P3D.pe=new T.Euler();P3D.pv=new T.Vector3();P3D.ps=new T.Vector3();
}
/* o: {x,y,z,vx,vy,vz,g,drag,vida,tam,cor,luz(bool),gira} */
function p3dPart(o){
  if(!P3D.partS||RM)return;const luz=!!o.luz,im=luz?P3D.partG:P3D.partS,k=luz?'g':'s';
  const slot=P3D.pi[k];P3D.pi[k]=(slot+1)%im.count;
  for(let i=P3D.parts.length-1;i>=0;i--)if(P3D.parts[i].im===im&&P3D.parts[i].slot===slot)P3D.parts.splice(i,1);
  o.im=im;o.slot=slot;o.t=-(o.atraso||0);o.vida=o.vida||0.8;o.c=new THREE.Color(o.cor||'#FFFFFF');o.rx=Math.random()*6;o.ry=Math.random()*6;
  P3D.parts.push(o);
}
function p3dPartQuadro(dt){
  if(!P3D.partS)return;const m=P3D.pm,q=P3D.pq,e=P3D.pe,v=P3D.pv,s=P3D.ps,c=P3D.pc;let us=false,ug=false;
  for(let i=P3D.parts.length-1;i>=0;i--){const p=P3D.parts[i];p.t+=dt;
    if(p.t<0){m.makeScale(0,0,0);p.im.setMatrixAt(p.slot,m);continue;}
    const k=p.t/p.vida;
    if(k>=1){m.makeScale(0,0,0);p.im.setMatrixAt(p.slot,m);P3D.parts.splice(i,1);if(p.im===P3D.partS)us=true;else ug=true;continue;}
    const dr=Math.exp(-(p.drag||0)*dt);p.vx*=dr;p.vz*=dr;p.vy=(p.vy||0)*dr-(p.g||0)*dt;
    p.x+=(p.vx||0)*dt;p.y+=p.vy*dt;p.z+=(p.vz||0)*dt;if(p.y<0.02&&p.g>0){p.y=0.02;p.vy*=-0.3;p.vx*=0.6;p.vz*=0.6;}
    p.rx+=(p.gira||3)*dt;p.ry+=(p.gira||3)*dt*0.7;
    const tam=p.tam*(p.luz?(k<0.2?k/0.2:1-(k-0.2)/0.8*0.6):(k<0.75?1:1-(k-0.75)/0.25));
    e.set(p.rx,p.ry,0);q.setFromEuler(e);v.set(p.x,p.y,p.z);s.set(tam,tam,tam);m.compose(v,q,s);p.im.setMatrixAt(p.slot,m);
    if(p.luz){c.copy(p.c).multiplyScalar(k<0.15?k/0.15:1-(k-0.15)/0.85);p.im.setColorAt(p.slot,c);}else p.im.setColorAt(p.slot,p.c);
    if(p.im===P3D.partS)us=true;else ug=true;}
  if(us){P3D.partS.instanceMatrix.needsUpdate=true;P3D.partS.instanceColor.needsUpdate=true;}
  if(ug){P3D.partG.instanceMatrix.needsUpdate=true;P3D.partG.instanceColor.needsUpdate=true;}
}
/* objetos de efeito (anel que cresce, feixe de luz, runa girando) */
function p3dFxObj(tipo,x,z,o){
  if(!P3D.mundo||RM)return;o=o||{};const T=window.THREE;
  let mesh;
  if(tipo==='feixe'){mesh=new T.Mesh(new T.CylinderGeometry(o.r||0.5,(o.r||0.5)*1.15,o.h||9,28,1,true),new T.MeshBasicMaterial({map:p3dTex('feixe'),color:o.cor||'#FFFFFF',transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false,fog:false}));mesh.position.set(x,(o.h||9)/2,z);}
  else{mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:p3dTex(tipo==='runa'?'runa':tipo==='disco'?'brilho':'anel'),color:o.cor||'#FFFFFF',transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,0.04+(o.y||0),z);mesh.renderOrder=3;}
  P3D.mundo.add(mesh);
  const f={mesh,tipo,t:-(o.atraso||0)/1000,dur:(o.dur||600)/1000,r0:o.r0||0.2,r1:o.r1||1.5,a:o.a==null?1:o.a,gira:o.gira||0};
  mesh.visible=false;P3D.fx.push(f);return f;
}
function p3dFxQuadro(dt){
  for(let i=P3D.fx.length-1;i>=0;i--){const f=P3D.fx[i];f.t+=dt;const m=f.mesh;
    if(f.t<0)continue;m.visible=true;const k=f.t/f.dur;
    if(k>=1){P3D.mundo.remove(m);m.geometry.dispose();m.material.dispose();P3D.fx.splice(i,1);continue;}
    if(f.tipo==='feixe'){const w=k<0.25?k/0.25:1-(k-0.25)/0.75*0.7;m.scale.set(w,1,w);m.material.opacity=f.a*(k<0.2?k/0.2:1-(k-0.2)/0.8);}
    else{const e=1-(1-k)*(1-k);const r=f.r0+(f.r1-f.r0)*(f.tipo==='runa'?Math.min(1,k*4):e);m.scale.set(r*2,r*2*0.85,1);if(f.gira)m.rotation.z+=f.gira*dt;m.material.opacity=f.a*(f.tipo==='runa'?(k<0.15?k/0.15:1-Math.max(0,(k-0.6)/0.4)):1-k);}
  }
  // luz de efeito apagando sozinha
  if(P3D.luzFx&&P3D.luzFx.intensity>0){P3D.luzFx.intensity=Math.max(0,P3D.luzFx.intensity-dt*(P3D.luzFx.userData.queda||4));}
}
function p3dLuz(x,z,cor,int,queda){const l=P3D.luzFx;if(!l||RM)return;l.color.set(cor);l.position.set(x,1.4,z);l.intensity=Math.max(l.intensity,int);l.userData.queda=queda||4;}
/* chamado por fxInvocar: o "estouro" da carta virando personagem, em 3D, no pé do lugar */
function p3dInvoca(P,lane,rar,o){
  if(!P3D.on||RM||!P3D.mundo)return;o=o||{};
  const sp=P3D.spots.find(q=>q.P===P&&q.i===lane);if(!sp)return;
  const x=sp.x,z=sp.z,cor=P3D_RAR[rar]||'#FFFFFF',R=Math.min(1,sp.w*0.45);
  const at=o.atraso||(rar==='lendaria'?700:rar==='epica'?420:rar==='rara'?300:280);
  // v10: rastro de invocação (Mascate) e o estouro da Lenda Viva (Ascensão III), só nas suas cartas
  if(P==='p'&&rar!=='ficha'){
    let rs='';try{rs=String((s.cosm&&s.cosm.usa&&s.cosm.usa.rastro)||'');}catch(e){}
    const RS={brasa:['#FF8A30','#FFD060'],folhas:['#3FA34D','#9BD34B'],bolhas:['#BFF4FF','#2E9FB5'],nevoa:['#B9A6FF','#7B5BD6'],bandeirinhas:['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230']};
    const k=Object.keys(RS).find(q=>rs.indexOf(q)>=0);
    if(k){const cs=RS[k];for(let i=0;i<26;i++){const a=i/26*6.283*2,r=R*(1.2-i/26*0.8);p3dPart({luz:k!=='folhas'&&k!=='bandeirinhas',x:x+Math.cos(a)*r,y:0.08+i*0.035,z:z+Math.sin(a)*r*0.8,vx:-Math.sin(a)*0.8,vy:k==='folhas'?0.2:0.9,vz:Math.cos(a)*0.6,g:k==='folhas'||k==='bandeirinhas'?1.2:0,drag:1.2,vida:0.9+Math.random()*0.4,tam:k==='nevoa'?0.14:k==='bolhas'?0.05:0.06,cor:cs[i%cs.length],gira:k==='folhas'||k==='bandeirinhas'?8:3,atraso:i*0.012});}}
    if(o.id&&p3dAscDe(o.id)>=3){const terr=(typeof CARD!=='undefined'&&CARD[o.id]&&CARD[o.id].terreno)||'neutro',tc=(typeof TERR_COR!=='undefined'&&TERR_COR[terr])||'#FFD35A';
      p3dFxObj('runa',x,z,{cor:tc,r0:R*1.5,r1:R*1.5,dur:at+800,gira:2.6,a:1});p3dFxObj('feixe',x,z,{cor:tc,r:R*0.7,h:10,dur:900,atraso:at-100,a:0.9});
      p3dFxObj('anel',x,z,{cor:tc,r0:0.2,r1:R*2.8,dur:700,atraso:at,a:1});
      for(let i=0;i<30;i++){const a=Math.random()*6.283,v=1.5+Math.random()*2;p3dPart({luz:true,x,y:0.3,z,vx:Math.cos(a)*v,vy:1.5+Math.random()*2.5,vz:Math.sin(a)*v,drag:1.4,vida:0.9,tam:0.07,cor:i%3?tc:'#FFF4D8',atraso:at/1000});}
      setTimeout(()=>p3dLuz(x,z,tc,3,2.4),at);}
  }
  const poeira=(n,forca,c2)=>{for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(0.8+Math.random()*1.6)*forca;p3dPart({x:x+Math.cos(a)*0.2,y:0.1,z:z+Math.sin(a)*0.2,vx:Math.cos(a)*v,vy:1+Math.random()*1.8*forca,vz:Math.sin(a)*v,g:6,drag:2.5,vida:0.6+Math.random()*0.4,tam:0.05+Math.random()*0.05,cor:c2||(Math.random()<0.5?'#C9A06A':'#E8D2A0'),atraso:at/1000});}};
  const brilhos=(n,c,alt,vel)=>{for(let i=0;i<n;i++){const a=Math.random()*6.283,d=Math.random()*R;p3dPart({luz:true,x:x+Math.cos(a)*d,y:0.1+Math.random()*0.4,z:z+Math.sin(a)*d*0.8,vx:(Math.random()-0.5)*0.4,vy:(vel||1.6)+Math.random()*1.4,vz:(Math.random()-0.5)*0.4,drag:1.2,vida:0.7+Math.random()*0.6,tam:0.05+Math.random()*0.06,cor:Math.random()<0.5?c:'#FFFFFF',atraso:(at+(alt||0))/1000+Math.random()*0.25});}};
  const anel=(c,r1,dur,a,atr)=>p3dFxObj('anel',x,z,{cor:c,r0:0.15,r1,dur,atraso:at+(atr||0),a});
  if(o.tipo==='construcao'){poeira(16,1.1,'#B08A5C');anel('#FFF2D0',R*1.5,500,0.8,120);setTimeout(()=>p3dLuz(x,z,'#FFE6B0',1.2,4),at);return;}
  if(rar==='ficha'){brilhos(10,'#FFE58A',0,1);anel('#FFFFFF',R*0.9,420,0.6);return;}
  setTimeout(()=>p3dLuz(x,z,cor,rar==='lendaria'?4:rar==='epica'?2.6:rar==='rara'?2:1.4,rar==='lendaria'?2.2:4),at);
  if(rar==='comum'){poeira(14,1);anel('#FFFFFF',R*1.2,460,0.55);brilhos(6,'#FFFFFF');return;}
  if(rar==='incomum'){poeira(12,1);anel(cor,R*1.6,560,0.95);anel('#FFFFFF',R*1.0,420,0.6,60);brilhos(14,cor);return;}
  if(rar==='rara'){p3dFxObj('runa',x,z,{cor,r0:R*1.1,r1:R*1.1,dur:at+700,gira:2.2,a:0.95});p3dFxObj('feixe',x,z,{cor,r:R*0.55,h:8,dur:700,atraso:at-200,a:0.85});poeira(10,1);anel(cor,R*1.8,600,1);brilhos(18,cor,0,2.2);return;}
  if(rar==='epica'){p3dFxObj('runa',x,z,{cor,r0:R*1.25,r1:R*1.25,dur:at+800,gira:-3.5,a:0.9});
    for(let i=0;i<36;i++){const a0=Math.random()*6.283,rr=R*(1.1+Math.random()*0.8),sp=4+Math.random()*2;const p={luz:true,x:x+Math.cos(a0)*rr,y:0.2+Math.random()*1.2,z:z+Math.sin(a0)*rr,vx:-Math.cos(a0)*rr*2+Math.sin(a0)*sp*0.4,vy:0.6,vz:-Math.sin(a0)*rr*2-Math.cos(a0)*sp*0.4,drag:1.5,vida:0.55,tam:0.06+Math.random()*0.05,cor:i%3?cor:'#F49AC1',atraso:Math.random()*0.3};p3dPart(p);}
    anel(cor,R*2.4,700,1);anel('#F49AC1',R*1.5,560,0.8,60);poeira(12,1.2);brilhos(18,cor,100,2);return;}
  // lendária: pilar dourado, anel de choque, faíscas douradas subindo
  p3dFxObj('feixe',x,z,{cor:'#FFB020',r:R*0.8,h:12,dur:at+1000,a:1});p3dFxObj('feixe',x,z,{cor:'#FFC840',r:R*0.6,h:12,dur:at+900,a:1});p3dFxObj('feixe',x,z,{cor:'#FFFFFF',r:R*0.32,h:12,dur:at+600,a:0.9});
  p3dFxObj('runa',x,z,{cor:'#FFD35A',r0:R*1.4,r1:R*1.4,dur:at+1000,gira:3,a:1});p3dFxObj('disco',x,z,{cor:'#FFE58A',r0:R,r1:R*2.2,dur:at+900,a:0.8});
  for(let i=0;i<26;i++){const a=Math.random()*6.283,d=Math.random()*R*0.9;p3dPart({luz:true,x:x+Math.cos(a)*d,y:0.1,z:z+Math.sin(a)*d,vy:2+Math.random()*3,vx:(Math.random()-0.5)*0.3,vz:(Math.random()-0.5)*0.3,drag:0.6,vida:1+Math.random()*0.5,tam:0.06+Math.random()*0.07,cor:Math.random()<0.5?'#FFF4C0':'#FFD35A',atraso:Math.random()*0.6});}
  anel('#FFD35A',R*3,800,1);anel('#FFFFFF',R*2,600,0.8,70);poeira(22,1.5);brilhos(20,'#FFD35A',200,2.5);
  for(let i=0;i<14;i++){const a=Math.random()*6.283,v=2+Math.random()*2;p3dPart({x,y:0.2,z,vx:Math.cos(a)*v,vy:3+Math.random()*2.5,vz:Math.sin(a)*v,g:9,drag:0.4,vida:1.1,tam:0.06,cor:'#F2C230',atraso:at/1000});}
}

/* ---------- personagens ---------- */
/* v10: tier da Ascensão de uma carta SUA (rivais nunca usam; "mostrar forma básica" desliga) */
function p3dAscDe(id){try{if(typeof ascVisivel==='function')return Math.max(0,Math.min(3,ascVisivel(id)|0));const c=s&&s.cards&&s.cards[id];return c&&!c.ascOff?Math.max(0,Math.min(3,c.asc|0)):0;}catch(e){return 0;}}
function p3dModelo(id,asc){
  const T=window.THREE;const f=window.CHAR3D&&window.CHAR3D[id];asc=asc|0;
  if(typeof f==='function'){
    try{let op=asc?{asc}:undefined;if(id==='heroi-voce'&&typeof heroiVisual==='function'){const v=heroiVisual();if(v)op=Object.assign({},op||{},v);}
      const r=f(T,window.KIT3D,op);
      if(r&&r.obj&&r.obj.isObject3D){const nz=new T.Group();let wid=1;nz.add(r.obj);
        // conferência de escala: fora do combinado (altura 0,6..2,6, pés no y=0), normaliza
        try{r.obj.updateMatrixWorld(true);const bb=new T.Box3().setFromObject(r.obj);const h=bb.max.y-bb.min.y;
          if(isFinite(h)&&h>0){let k=1;if(h<0.6||h>2.6){k=1.4/h;nz.scale.setScalar(k);}if(bb.min.y<-0.2||bb.min.y>1.6)r.obj.position.y-=bb.min.y;wid=Math.max(bb.max.x-bb.min.x,(bb.max.z-bb.min.z)*0.6)*k;}}catch(e){}
        // v9: só as peças grandes fazem sombra (olhinhos, brilhos e pupilas não: metade das chamadas da passada de sombra)
        nz.updateMatrixWorld(true);const ks=1/Math.max(1e-3,nz.scale.x);
        nz.traverse(m=>{if(m.isMesh){let rr=1;try{if(!m.geometry.boundingSphere)m.geometry.computeBoundingSphere();rr=m.geometry.boundingSphere.radius*m.matrixWorld.getMaxScaleOnAxis()*ks;}catch(e){}m.castShadow=rr>0.085;m.receiveShadow=false;}});
        let ascT=null;if(asc&&window.KIT3D&&KIT3D.ascAplicar){const terr=(typeof CARD!=='undefined'&&CARD[id]&&CARD[id].terreno)||'neutro';try{ascT=KIT3D.ascAplicar(r.obj,asc,(typeof TERR_COR!=='undefined'&&TERR_COR[terr])||'#FFD35A',terr);}catch(e){ascT=null;}}
        return {obj:nz,raiz:r.obj,anim:typeof r.anim==='function'?r.anim:null,fb:false,wid,asc:ascT,tier:asc};}
    }catch(e){}
  }
  return p3dMedalhao(id);
}
/* reserva: a arte da carta num medalhão 3D redondo de pé num suporte de madeira (enquanto o modelo não existe) */
function p3dMedalhao(id){
  const T=window.THREE;const c=(typeof CARD!=='undefined'&&CARD[id])||null;const rar=c?c.rar:'comum';
  const cv=document.createElement('canvas');cv.width=cv.height=256;const g=cv.getContext('2d');
  try{medalhaoPintar(g,id,{semNome:true});}catch(e){g.fillStyle='#3A2A20';g.fillRect(0,0,256,256);}
  const tex=new T.CanvasTexture(cv);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;
  const aro=new T.MeshStandardMaterial({color:(typeof RAR_COR!=='undefined'&&RAR_COR[rar])||'#9A9488',roughness:0.35,metalness:rar==='lendaria'?0.6:0.15});
  const frente=new T.MeshStandardMaterial({map:tex,roughness:0.55});const costas=new T.MeshStandardMaterial({color:'#6B4630',roughness:0.8});
  const root=new T.Group(),corpo=new T.Group();root.add(corpo);
  const disco=new T.Mesh(new T.CylinderGeometry(0.46,0.46,0.09,40),[aro,frente,costas]);disco.rotation.x=Math.PI/2;disco.rotation.y=Math.PI/2;
  const face=new T.Group();face.add(disco);const borda=new T.Mesh(new T.TorusGeometry(0.47,0.045,10,40),aro);face.add(borda);face.position.y=0.78;corpo.add(face);
  const mad=new T.MeshStandardMaterial({color:'#8E5F38',roughness:0.85});
  const haste=new T.Mesh(new T.CylinderGeometry(0.05,0.06,0.4,10),mad);haste.position.y=0.2;corpo.add(haste);
  const base=new T.Mesh(new T.CylinderGeometry(0.28,0.32,0.1,20),mad);base.position.y=0.05;root.add(base);
  root.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  return {obj:root,fb:true,wid:1,anim(st,t,p){
    let y=0.78+Math.sin(t*2.2)*0.035,rx=0,rz=Math.sin(t*1.3)*0.05,s=1,ry=Math.sin(t*0.9)*0.15;
    if(st==='sono'){y=0.74+Math.sin(t*1.1)*0.02;rx=0.25;rz=0.12;}
    else if(st==='atk'){const k=p<0.35?p/0.35:p<0.55?1:1-(p-0.55)/0.45;rx=p<0.35?-0.3*k:0.5*k;s=1+0.12*k;}
    else if(st==='hit'){const k=1-p;rz=Math.sin(p*25)*0.3*k;rx=-0.2*k;}
    else if(st==='entra'){const e=Math.min(1,p/0.6);s=0.2+0.8*e+(p>0.6?Math.sin((p-0.6)*12)*0.08*(1-p):0);ry=(1-e)*6.28;}
    face.position.y=y;face.rotation.set(rx,ry,rz);face.scale.setScalar(s);
  }};
}
function p3dMats(root){const set=new Map();root.traverse(m=>{if(!m.isMesh||!m.material)return;for(const x of (Array.isArray(m.material)?m.material:[m.material]))if(!set.has(x))set.set(x,{em:x.emissive?x.emissive.clone():null,op:x.opacity,tr:x.transparent,dw:x.depthWrite});});return set;}
function p3dNovaUnidade(key,id,P,lane,isB){
  const T=window.THREE;const inst=p3dModelo(id,(P==='p'&&!isB)?p3dAscDe(id):0);p3dToonTudo(inst.obj);
  const holder=new T.Group(),yawG=new T.Group(),rollG=new T.Group();holder.add(rollG);rollG.add(yawG);yawG.add(inst.obj);
  // anel da raridade no chão (sobe junto com quem corre)
  const c=(typeof CARD!=='undefined'&&CARD[id])||null,rar=c?c.rar:'comum';
  let anel=null;
  if(!isB&&rar!=='comum'){anel=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:p3dTex(rar==='lendaria'?'brilho':'anel'),color:P3D_RAR[rar],transparent:true,opacity:rar==='incomum'?0.35:rar==='rara'?0.45:0.55,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));
    anel.rotation.x=-Math.PI/2;anel.position.y=0.03;const r=rar==='lendaria'?1.25:0.95;anel.scale.set(r,r*0.82,1);anel.renderOrder=2;holder.add(anel);
    if(rar==='lendaria'){const a2=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:p3dTex('runa'),color:'#FFE58A',transparent:true,opacity:0.6,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,fog:false}));a2.rotation.x=-Math.PI/2;a2.position.y=0.035;a2.scale.set(1.15,1.15,1);a2.renderOrder=2;holder.add(a2);anel.userData.runa=a2;}}
  // v11: sombra redonda no chão (no lugar do mapa de sombras)
  const sombra=new T.Mesh(new T.PlaneGeometry(1,1),P3D.matSombra||(P3D.matSombra=new T.MeshBasicMaterial({map:p3dTex('brilho'),color:'#000000',transparent:true,opacity:0.42,depthWrite:false,toneMapped:false,fog:false})));
  sombra.rotation.x=-Math.PI/2;sombra.renderOrder=1;const sw=Math.max(0.7,Math.min(1.5,(inst.wid||1)*0.95));sombra.scale.set(sw,sw*0.7,1);holder.add(sombra);
  P3D.scene.add(holder);
  const U={key,id,P,lane,isB,holder,rollG,yawG,inst,anel,rar,sombra,mats:p3dMats(inst.obj),yaw:null,home:new T.Vector3(),cur:new T.Vector3(),prev:null,op:1,fl:0,flc:'',dissolvido:false,ok:true,vy:0};
  return U;
}
function p3dTirarUnidade(U,ja){
  if(!U)return;if(U.holder.parent)U.holder.parent.remove(U.holder);
  if(U.sombra){U.holder.remove(U.sombra);U.sombra.geometry.dispose();}
  try{p3dDescartar(U.holder);}catch(e){}
}
/* derrete em pedacinhos coloridos que sobem (a morte) */
function p3dDissolver(U){
  if(U.dissolvido)return;U.dissolvido=true;
  const T=window.THREE;const v=new T.Vector3();let n=0;const meshes=[];U.inst.obj.updateMatrixWorld(true);
  U.inst.obj.traverse(m=>{if(m.isMesh&&m.geometry&&m.geometry.attributes.position)meshes.push(m);});
  const alvo=Math.min(90,Math.max(30,meshes.length*4));
  for(let k=0;k<alvo&&meshes.length;k++){const m=meshes[k%meshes.length];const pa=m.geometry.attributes.position;const i=Math.floor(Math.random()*pa.count);v.fromBufferAttribute(pa,i).applyMatrix4(m.matrixWorld);
    const mt=Array.isArray(m.material)?m.material[0]:m.material;const cor=mt&&mt.color?'#'+mt.color.getHexString():'#FFFFFF';
    p3dPart({x:v.x,y:v.y,z:v.z,vx:(Math.random()-0.5)*0.8,vy:0.4+Math.random()*1.2,vz:(Math.random()-0.5)*0.8,g:-0.6,drag:0.8,vida:0.8+Math.random()*0.6,tam:0.035+Math.random()*0.04,cor,atraso:Math.random()*0.25});n++;}
  const p=U.holder.position;
  for(let k=0;k<10;k++)p3dPart({luz:true,x:p.x+(Math.random()-0.5)*0.6,y:0.15+Math.random()*0.6,z:p.z+(Math.random()-0.5)*0.4,vy:0.9+Math.random()*0.8,vx:(Math.random()-0.5)*0.2,vz:(Math.random()-0.5)*0.2,drag:0.5,vida:1+Math.random()*0.4,tam:0.06+Math.random()*0.05,cor:P3D_RAR[U.rar]||'#FFFFFF',atraso:0.1+Math.random()*0.25});
  U.holder.visible=false;
}
/* lê as transformações do DOM (WAAPI) */
const P3D_MRX=/matrix(3d)?\(([^)]+)\)/;
function p3dMatriz(tr){if(!tr||tr==='none')return null;const m=P3D_MRX.exec(tr);if(!m)return null;const n=m[2].split(',').map(parseFloat);
  if(m[1])return {a:n[0],b:n[1],c:n[4],d:n[5],e:n[12],f:n[13]};return {a:n[0],b:n[1],c:n[2],d:n[3],e:n[4],f:n[5]};}
const P3D_BRI=/brightness\(([\d.]+)\)/,P3D_DS=/drop-shadow\((rgba?\([^)]+\))/;
function p3dUnidadesQuadro(now,dt){
  const vistos=new Set();const T=window.THREE;
  const tt=RM?0:now/1000;
  let atacante=null;
  const lista=[];
  for(const P of ['p','r'])for(let i=0;i<4;i++){const ln=document.getElementById('ln-'+P+'-'+i);if(!ln)continue;
    const card=ln.querySelector('.sl .card.unit');if(card)lista.push({key:'u'+card.dataset.uid,el:card,fig:card.querySelector('.fig'),cv:card.querySelector('canvas.spr'),id:card.dataset.id,P,i,isB:false,E:SPR.u.get(String(card.dataset.uid))});
    const bs=ln.querySelector('.bs.has');if(bs){const E=SPR.u.get('b'+bs.dataset.u);const L=B&&B.sides[P].lanes[i].b;const id=(E&&E.id)||(L&&L.id);if(id)lista.push({key:'b'+bs.dataset.u,el:bs,fig:bs.querySelector('.bfig'),cv:bs.querySelector('canvas.spr'),id,P,i,isB:true,E});}}
  for(const it of lista){
    if(!it.fig||!it.cv)continue;
    let U=P3D.units.get(it.key);
    if(U&&U.id!==it.id){p3dTirarUnidade(U);P3D.units.delete(it.key);U=null;}
    if(!U){U=p3dNovaUnidade(it.key,it.id,it.P,it.i,it.isB);P3D.units.set(it.key,U);}
    vistos.add(it.key);U.el=it.el;
    if(!it.isB){try{const lc=B&&B.sides[it.P].lanes[it.i].c;if(lc&&lc.id===it.id&&U.inst.raiz)U.inst.raiz.userData.comeu=Math.min(4,lc.comeu|0);}catch(e){}}
    // ---- onde o DOM põe os pés ----
    const r=it.el.getBoundingClientRect();if(!r.width&&!r.height){U.holder.visible=false;continue;}
    const fw=it.fig.offsetWidth,fh=it.fig.offsetHeight;
    const bx=r.left+it.fig.offsetLeft+fw/2,by=r.top+it.fig.offsetTop+fh*0.9375;
    const csF=getComputedStyle(it.fig),csC=getComputedStyle(it.cv),csE=getComputedStyle(it.el);
    const mf=p3dMatriz(csF.transform),mc=p3dMatriz(csC.transform);
    const sF=mf?Math.hypot(mf.a,mf.b):1;
    const E=it.E;let st=E&&E.sono?'sono':'idle',p=0;
    if(E&&E.act&&!RM){const a=E.act,fim=a.kf?a.kf[a.kf.length-1][0]:a.dur;if(now-a.t0<fim){st=a.st;p=Math.max(0,Math.min(1,sprP(a,now)));}}
    let fx=mf?mf.e:0,fy=mf?mf.f:0,lift=0;
    if(st==='entra'&&fy<0){lift=-fy;fy=0;} // entrada caindo do céu (construção, lendária): sobe, não anda
    p3dChao(bx,by,U.home);
    // o seu atacante para NA FRENTE da fila do rival, abaixo dos números dela (o HTML fica por cima do 3D)
    if(it.P==='p'&&!it.isB&&(fx||fy)){const lim=p3dLimiteRival();if(lim&&by+fy<lim-fh*0.12)fy=lim-fh*0.12-by;}
    p3dChao(bx+fx,by+fy,U.cur);
    // fora da placa o chão é mais baixo (a ilha): o mesmo ponto da tela, no plano do chão de lá
    {const hp=p3dPe(U.cur.x,U.cur.z);if(hp<-0.002){P3D.plano.constant=-hp;p3dChao(bx+fx,by+fy,U.cur);P3D.plano.constant=0;U.cur.y=p3dPe(U.cur.x,U.cur.z);}else U.cur.y=0;}
    const ppuH=p3dPPU(U.home),ppuC=p3dPPU(U.cur);
    P3D.v1.set(U.home.x+1,0,U.home.z);const hA=p3dTela(U.home),hB=p3dTela(P3D.v1);const ppuX=Math.max(1e-3,Math.hypot(hA.x-hB.x,hA.y-hB.y));
    const lw=(it.isB?fw*1.6:(U.lw||(U.lw=(it.el.closest('.lane')||it.el).getBoundingClientRect().width)));
    const k=Math.min(fh/(1.6*ppuH),lw*(it.isB?0.9:1.08)/(Math.max(0.9,U.inst.wid||1)*ppuX));
    // pulinhos/estica-e-puxa/tombo do canvas
    let cy=0,sx=1,sy=1,rot=0;
    if(mc){rot=Math.atan2(mc.b,mc.a);sx=Math.hypot(mc.a,mc.b);sy=(mc.a*mc.d-mc.b*mc.c)/(sx||1);cy=mc.f;}
    lift+=Math.max(0,-cy)*sF;
    const esc=k*sF*ppuH/ppuC;
    const H=U.holder;
    H.position.set(U.cur.x,U.cur.y+lift/ppuC,U.cur.z);
    H.scale.set(esc*sx,esc*sy,esc*sx);
    if(U.sombra){const hy=lift/ppuC,ks=Math.max(0.35,1-hy*0.5),sw=Math.max(0.7,Math.min(1.5,(U.inst.wid||1)*0.95))*ks; // fica no chão quando pula
      U.sombra.position.y=(-hy+0.012)/Math.max(1e-3,esc*sy);U.sombra.scale.set(sw,sw*0.7,1);}
    U.rollG.rotation.z=-rot;
    // de frente: para onde anda; parado em casa, de frente para a câmera (virado um tiquinho para o meio)
    const dHome=U.cur.distanceTo(U.home);U.dHome=dHome;
    if(U.prev&&dt>0){const vx=(U.cur.x-U.prev.x)/dt,vz=(U.cur.z-U.prev.z)/dt;const sp=Math.hypot(vx,vz);
      if(sp>1.6*Math.max(0.6,k)&&dHome>0.12)U.yawT=Math.atan2(vx,vz);else if(dHome<0.1)U.yawT=null;}
    if(!U.prev)U.prev=new T.Vector3();U.prev.copy(U.cur);
    if(dHome>0.6)atacante=U;
    // opacidade (fx-pre, morte, entrada) e brilho (golpe, cura, buff)
    let op=(parseFloat(csE.opacity)||0)*(parseFloat(csF.opacity));if(!isFinite(op))op=1;
    const fil=csC.filter||'';const mb=P3D_BRI.exec(fil);let fl=mb?Math.max(0,parseFloat(mb[1])-1):0;const ds=P3D_DS.exec(fil);
    p3dOpacidade(U,op);p3dBrilho(U,Math.min(1.2,fl),ds&&mb?ds[1]:'');
    if((st!=='idle'&&st!=='sono')||dHome>0.03||op<0.99||fl>0)p3dAcao(400);
    // morte: o canvas some no meio da queda → vira pedacinhos
    if(it.el.dataset.morto==='1'&&it.cv.style.visibility==='hidden')p3dDissolver(U);
    if(!U.dissolvido)H.visible=op>0.02;
    // pose do personagem
    if(U.inst.anim&&U.ok){try{U.inst.anim(st,RM?0:tt+(E?E.off:0),p);}catch(e){U.ok=false;}}
    if(U.inst.asc&&!RM){try{U.inst.asc.tick(tt+(E?E.off:0));}catch(e){U.inst.asc=null;}}
    if(U.anel){U.anel.visible=!U.dissolvido&&op>0.3;U.anel.material.opacity=(U.rar==='lendaria'?0.55+(RM?0:Math.sin(tt*2.4)*0.15):U.rar==='incomum'?0.3:U.rar==='rara'?0.42:0.52)*Math.min(1,op);
      if(U.anel.userData.runa){U.anel.userData.runa.rotation.z=RM?0:tt*0.6;U.anel.userData.runa.visible=U.anel.visible;}}
  }
  // quem está em casa olha para quem chegou para brigar
  for(const U of P3D.units.values()){if(!vistos.has(U.key))continue;
    let alvo=U.yawT;
    if(alvo==null){if(atacante&&atacante!==U&&atacante.P!==U.P&&U.dHome<0.2&&atacante.cur.distanceTo(U.cur)<2.2)alvo=Math.atan2(atacante.cur.x-U.cur.x,atacante.cur.z-U.cur.z);
      // v11: as suas olham para o lado do rival (de costas para a câmera, em 3/4 para o meio, para ver o rosto de perfil);
      // as do rival olham para você
      else if(U.P==='r')alvo=Math.max(-0.35,Math.min(0.35,-U.home.x*0.07));
      else{const sg=U.home.x>0.05?-1:U.home.x<-0.05?1:(U.lane<2?1:-1);alvo=Math.PI-Math.max(-0.65,Math.min(0.65,sg*0.4-U.home.x*0.08));}}
    if(U.yaw==null||RM)U.yaw=alvo;else{let d=alvo-U.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));U.yaw+=d*Math.min(1,dt*10);}
    U.yawG.rotation.y=U.yaw;}
  // quem saiu do DOM: some (os que já se desfizeram esperam as partículas)
  for(const [k,U] of P3D.units)if(!vistos.has(k)){if(U.el&&U.el.dataset&&U.el.dataset.morto==='1'&&!U.dissolvido)p3dDissolver(U);p3dTirarUnidade(U);P3D.units.delete(k);}
}
function p3dLimiteRival(){let m=0;for(let i=0;i<4;i++){const ln=document.getElementById('ln-r-'+i);if(!ln)continue;const c=ln.querySelector('.card.unit .cn')||ln.querySelector('.card.unit .ft');if(c){const r=c.getBoundingClientRect();if(r.height)m=Math.max(m,r.bottom+r.height*0.2);}}
  return m||null;}
function p3dOpacidade(U,op){
  op=Math.max(0,Math.min(1,op));if(op>=0.995)op=1;if(op===U.op||(op<1&&Math.abs(op-U.op)<0.01))return;U.op=op;
  for(const [m,o] of U.mats){if(op>=0.995){m.transparent=o.tr;m.opacity=o.op;m.depthWrite=o.dw;}else{m.transparent=true;m.opacity=o.op*op;m.depthWrite=op>0.6&&o.dw;}}
}
function p3dBrilho(U,fl,cor){
  const key=fl.toFixed(2)+cor;if(key===U.flc)return;U.flc=key;
  let c=null;if(cor){try{c=new THREE.Color(cor.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/,'rgb($1,$2,$3)'));}catch(e){c=null;}}
  for(const [m,o] of U.mats){if(!o.em)continue;m.emissive.copy(o.em);if(fl>0){if(c)m.emissive.lerp(c,Math.min(1,fl*1.2));else m.emissive.lerp(P3D.branco||(P3D.branco=new THREE.Color(1,1,1)),Math.min(0.8,fl*0.45));}}
}
/* ---------- o laço ---------- */
function p3dLoop(now){
  P3D.raf=0;
  if(!P3D.on||document.hidden)return;
  const bt=document.getElementById('battle');if(!bt||bt.hidden||!P3D.scene){return;}
  P3D.raf=requestAnimationFrame(p3dLoop);
  // v11: ritmo. Celular: 30 quadros por segundo sempre (esquentava). Computador: 60 com ação, 30 parado.
  // Telas de 120 Hz (Mac, iPhone Pro) não passam de 60.
  const iv=p3dIntervalo(now);
  if(P3D.last&&now-P3D.last<iv-3)return;
  const dt=P3D.last?Math.min(0.1,(now-P3D.last)/1000):0.016;P3D.last=now;
  const t0=performance.now();
  try{p3dQuadro(now,dt,bt);}catch(e){P3D.erros=(P3D.erros||0)+1;if(P3D.erros>5)p3dFalhar();}
  P3D.custo=(P3D.custo||0)*0.9+(performance.now()-t0)*0.1;
}
function p3dIntervalo(now){
  if(P3D.G&&P3D.G.cel||P3D.soft||P3D.qual>=2)return 1000/30;
  const acao=P3D.parts.length||P3D.fx.length||(typeof BU!=='undefined'&&BU.busy)||now<(P3D.acaoAte||0);
  return acao?1000/60:1000/30;
}
function p3dAcao(ms){P3D.acaoAte=Math.max(P3D.acaoAte||0,performance.now()+(ms||600));}
function p3dQuadro(now,dt,bt){
  // geometria (tela girou, painel cresceu)
  if(!P3D.G||now-P3D.chk>400){P3D.chk=now;const k=p3dChave();if(k&&k!==P3D.gk){if(p3dMedir()){P3D.gk=k;const mk=k.split(',').slice(0,4).join(',')+'|'+p3dTerrs()+'|'+((B&&B.arena)||1);
      if(mk!==P3D.mk||!P3D.mundo){P3D.mk=mk;for(const U of P3D.units.values())p3dTirarUnidade(U);P3D.units.clear();p3dMontarCena();}}}
    else if(P3D.mundo){const mk=P3D.gk.split(',').slice(0,4).join(',')+'|'+p3dTerrs()+'|'+((B&&B.arena)||1);if(mk!==P3D.mk){P3D.mk=mk;for(const U of P3D.units.values())p3dTirarUnidade(U);P3D.units.clear();p3dMontarCena();}}}
  if(!P3D.G||!P3D.mundo)return;
  const t=RM?0:(now-P3D.t0)/1000;P3D.uT.value=t;
  // tremor da tela (fxTremor mexe no #board): a câmera acompanha
  let shx=0,shy=0;const bd=document.getElementById('board');if(bd&&!RM){const m=p3dMatriz(getComputedStyle(bd).transform);if(m){shx=m.e;shy=m.f;}}
  p3dVista(bt.scrollTop,shx,shy);
  p3dUnidadesQuadro(now,dt);
  p3dMarcasQuadro(t);
  p3dHeroisQuadro(t,now);
  if(!RM)for(const f of P3D.amb)f(t);
  // tempestade: relâmpago de vez em quando
  p3dMeiaNoiteQuadro(dt,now);
  if(P3D.raio&&!RM&&P3D.hemi){if(now>P3D.raioT){P3D.raioT=now+5000+Math.random()*7000;P3D.flashT=now;}const k=(now-P3D.flashT)/1000;P3D.hemi.intensity=P3D.hemiI+(k<0.5?(k<0.08?1.4:k<0.16?0.2:k<0.24?1:Math.max(0,1-(k-0.24)*4)):0);}
  p3dPartQuadro(dt);p3dFxQuadro(dt);
  // sombra: celular atualiza o mapa a cada 2 quadros
  const r=P3D.r;
  p3dRender();
  // qualidade adaptativa: média dos últimos quadros
  // (v11: compara com o ritmo pedido; 30 qps de propósito não conta como lento)
  P3D.frames++;P3D.acc=(P3D.acc||0)+dt;P3D.alvoAcc=(P3D.alvoAcc||0)+p3dIntervalo(now)/1000;
  if(P3D.frames>=90){const media=P3D.acc/P3D.frames,alvo=P3D.alvoAcc/P3D.frames;P3D.frames=0;P3D.acc=0;P3D.alvoAcc=0;P3D.fps=Math.round(1/media);
    if(!window.__P3DQ&&media>alvo*1.45&&P3D.qual<2){P3D.qual++;r.setPixelRatio(p3dPR());r.setSize(P3D.G.W,P3D.G.H,false);p3dPosTam();}}
}

