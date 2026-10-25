/* ===================== v8: KIT3D — ajudantes opcionais para os modelos 3D (window.KIT3D) =====================
   O motor chama window.CHAR3D[id](THREE, window.KIT3D). Os modelos NÃO podem depender do kit (pode vir undefined);
   ele só encurta código. Tudo é construído na hora da chamada (nada de THREE no carregamento da página).
   API (T = THREE; cores em '#RRGGBB' ou número):
     KIT3D.mat(cor,o)           → MeshStandardMaterial "argila" (roughness .62, metalness 0). o: {rough,metal,emissive,emi,flat,opacity}
                                  (um material novo por chamada: cada modelo tem os seus, o motor muda o brilho deles nos golpes)
     KIT3D.toon(cor,o)          → MeshToonMaterial com degradê de 3 tons (o mesmo gradiente para todos)
     KIT3D.sphere(r,mat,seg)    → Mesh esfera (seg padrão 20), castShadow
     KIT3D.capsule(r,len,mat)   → Mesh cápsula em pé (eixo Y)
     KIT3D.cyl(rt,rb,h,mat,seg) → Mesh cilindro (seg 16)
     KIT3D.cone(r,h,mat,seg)    → Mesh cone
     KIT3D.torus(r,t,mat)       → Mesh toro
     KIT3D.box(w,h,d,mat)       → Mesh caixa
     KIT3D.blob(rx,ry,rz,mat)   → esfera esticada (ellipsoide) — o "corpo de argila" básico
     KIT3D.eyes(o)              → Group com dois olhos fofos (branco + pupila + brilho); o: {r:.09, gap:.13, cor:'#1A1420'}
                                  devolve g com g.userData.blink(k) (k 0 aberto .. 1 fechado) para piscar no anim()
     KIT3D.at(obj,x,y,z,rx,ry,rz,s) → posiciona/gira/escala e devolve obj (encadeável)
     KIT3D.group(...filhos)     → Group com os filhos
     KIT3D.shadows(root)        → castShadow em todas as malhas do root
     KIT3D.ease.{out,in,io,back}(k) e KIT3D.osc(t,vel,amp,fase) = amp*sin(t*vel+fase)
     KIT3D.fase(p,a,b)          → 0..1 dentro do trecho [a,b] de p (útil para atk: 0-.35 prepara, .35-.55 golpe)
*/
window.KIT3D=(function(){
  const T=()=>window.THREE;
  let grad=null;
  const K={
    mat(cor,o){o=o||{};const t=T();const m=new t.MeshStandardMaterial({color:cor,roughness:o.rough==null?0.62:o.rough,metalness:o.metal||0,flatShading:!!o.flat});
      if(o.emissive){m.emissive=new t.Color(o.emissive);m.emissiveIntensity=o.emi==null?1:o.emi;}
      if(o.opacity!=null&&o.opacity<1){m.transparent=true;m.opacity=o.opacity;}return m;},
    toon(cor,o){o=o||{};const t=T();
      if(!grad){const d=new Uint8Array([90,170,255]);grad=new t.DataTexture(d,3,1,t.RedFormat);grad.minFilter=grad.magFilter=t.NearestFilter;grad.needsUpdate=true;}
      const m=new t.MeshToonMaterial({color:cor,gradientMap:grad});if(o.emissive){m.emissive=new t.Color(o.emissive);}return m;},
    _m(g,mat){const t=T();const m=new t.Mesh(g,mat||K.mat('#FFFFFF'));m.castShadow=true;return m;},
    sphere(r,mat,seg){const t=T();seg=seg||20;return K._m(new t.SphereGeometry(r,seg,Math.max(8,Math.round(seg*0.75))),mat);},
    capsule(r,len,mat){const t=T();return K._m(new t.CapsuleGeometry(r,len,6,14),mat);},
    cyl(rt,rb,h,mat,seg){const t=T();return K._m(new t.CylinderGeometry(rt,rb,h,seg||16),mat);},
    cone(r,h,mat,seg){const t=T();return K._m(new t.ConeGeometry(r,h,seg||16),mat);},
    torus(r,tb,mat){const t=T();return K._m(new t.TorusGeometry(r,tb,10,24),mat);},
    box(w,h,d,mat){const t=T();return K._m(new t.BoxGeometry(w,h,d),mat);},
    blob(rx,ry,rz,mat){const m=K.sphere(1,mat,22);m.scale.set(rx,ry,rz);return m;},
    at(o,x,y,z,rx,ry,rz,s){o.position.set(x||0,y||0,z||0);o.rotation.set(rx||0,ry||0,rz||0);if(s!=null){if(typeof s==='number')o.scale.setScalar(s);else o.scale.set(s[0],s[1],s[2]);}return o;},
    group(...f){const t=T();const g=new t.Group();for(const c of f)if(c)g.add(c);return g;},
    shadows(root){root.traverse(o=>{if(o.isMesh)o.castShadow=true;});return root;},
    eyes(o){o=o||{};const t=T();const r=o.r||0.09,gap=o.gap||0.13;
      const w=K.mat('#FFFFFF',{rough:0.35}),p=K.mat(o.cor||'#1A1420',{rough:0.3}),h=new t.MeshBasicMaterial({color:'#FFFFFF'});
      const g=new t.Group();const lids=[];
      for(const s of [-1,1]){const e=new t.Group();e.position.set(s*gap,0,0);
        const b=K.sphere(r,w,18);b.scale.set(1,1.12,0.7);e.add(b);
        const pu=K.sphere(r*0.62,p,14);pu.position.set(0,-r*0.08,r*0.48);pu.scale.set(1,1.15,0.6);e.add(pu);
        const hl=new t.Mesh(new t.SphereGeometry(r*0.22,10,8),h);hl.position.set(r*0.22,r*0.25,r*0.72);e.add(hl);
        g.add(e);lids.push(e);}
      g.userData.blink=k=>{const s=Math.max(0.08,1-k);for(const e of lids)e.scale.y=s;};
      return g;},
    ease:{out:k=>1-(1-k)*(1-k),in:k=>k*k,io:k=>k<0.5?2*k*k:1-Math.pow(-2*k+2,2)/2,back:k=>{const c=1.7;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2);}},
    osc:(t,v,a,f)=>a*Math.sin(t*v+(f||0)),
    fase:(p,a,b)=>Math.max(0,Math.min(1,(p-a)/Math.max(1e-6,b-a))),
    /* v10: ASCENSÃO, tiers I–II (o III é detalhe do próprio modelo, o.asc>=3).
       I · Desperta: pupilas acesas na cor do reino + luz de contorno (rim) na cor do reino em todos os materiais.
       II · Assombrosa: + aura de partículas do reino (Sertão brasas, Mata folhas, Águas bolhas, Noite névoa, Arraial confete).
       Os materiais do root são clonados antes (nada vaza para outra instância que use o mesmo material).
       Devolve {tick(t)} (anima a aura; chamar a cada quadro) ou null quando tier<1. reino: chave do terreno (opcional). */
    ascAplicar(root,tier,cor,reino){
      tier=tier|0;if(!root||tier<1)return null;const t=T();const C=new t.Color(cor||'#FFD35A');
      const clones=new Map();const cl=m=>{if(!m||!m.isMaterial)return m;let c=clones.get(m);if(!c){c=m.clone();c.userData=Object.assign({},m.userData);clones.set(m,c);}return c;};
      root.traverse(o=>{if(!o.isMesh||!o.material)return;o.material=Array.isArray(o.material)?o.material.map(cl):cl(o.material);});
      const rimK=tier>=2?1.0:0.7;
      for(const [o0,m] of clones){
        // o clone não herda onBeforeCompile/customProgramCacheKey do original: copia à mão (modelos com shader próprio)
        const prev=o0.hasOwnProperty('onBeforeCompile')?o0.onBeforeCompile:null,pk=o0.hasOwnProperty('customProgramCacheKey')?o0.customProgramCacheKey:null;
        if(prev)m.onBeforeCompile=prev;if(pk)m.customProgramCacheKey=pk;
        if(m.flatShading||(!m.isMeshStandardMaterial&&!m.isMeshToonMaterial&&!m.isMeshPhongMaterial))continue;
        const u={value:C.clone().lerp(new t.Color('#FFFFFF'),0.3)},uk={value:rimK};
        m.onBeforeCompile=function(sh,r){if(prev)prev.call(this,sh,r);sh.uniforms.uAscCor=u;sh.uniforms.uAscK=uk;
          sh.fragmentShader='uniform vec3 uAscCor;uniform float uAscK;\n'+sh.fragmentShader.replace('#include <dithering_fragment>',
            '#include <dithering_fragment>\n{float ar=1.0-clamp(abs(dot(normalize(vNormal),normalize(vViewPosition))),0.0,1.0);gl_FragColor.rgb+=uAscCor*smoothstep(0.45,0.95,ar)*0.75*uAscK;}');};
        m.customProgramCacheKey=function(){return 'asc|'+(pk?pk.call(this):'');};m.needsUpdate=true;
      }
      // olhos: o que é escuro (pupila) acende; o branco ganha um leve tom
      root.traverse(o=>{if(!o.isMesh||!o.userData||!o.userData.olho)return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(!m||!m.color)continue;
        const l=m.color.r*0.3+m.color.g*0.59+m.color.b*0.11;
        if(m.emissive){if(l<0.35){m.emissive.copy(C);m.emissiveIntensity=tier>=2?2.2:1.6;m.color.lerp(C,0.5);}else if(l<0.95){m.emissive.copy(C);m.emissiveIntensity=0.25;}}
        else if(l<0.35)m.color.copy(C);}});
      if(tier<2)return {tick(){}};
      // aura de partículas (um Points só)
      const tipo={milharal:'brasa',pomar:'folha',brejo:'bolha',pasto:'nevoa',neutro:'confete'}[reino]||'brasa';
      let box=null;try{root.updateMatrixWorld(true);box=new t.Box3().setFromObject(root);}catch(e){}
      const sx=box?Math.max(0.3,(box.max.x-box.min.x)*0.55):0.5,hy=box?Math.max(0.5,box.max.y-box.min.y):1.2,y0=box?box.min.y:0;
      const n=tipo==='nevoa'?12:22,pos=new Float32Array(n*3),cols=new Float32Array(n*3),base=[];
      const conf=['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#F2C230'];
      for(let i=0;i<n;i++){base.push([Math.random()*6.283,Math.random(),0.6+Math.random()*0.8]);const c=new t.Color(tipo==='confete'?conf[i%5]:tipo==='folha'?(i%2?'#7CC850':'#3FA34D'):tipo==='bolha'?'#BFF4FF':C);cols.set([c.r,c.g,c.b],i*3);}
      const g=new t.BufferGeometry();g.setAttribute('position',new t.BufferAttribute(pos,3));g.setAttribute('color',new t.BufferAttribute(cols,3));
      if(!K._dot){const cv=document.createElement('canvas');cv.width=cv.height=64;const q=cv.getContext('2d');const gr=q.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.35,'rgba(255,255,255,.7)');gr.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=gr;q.fillRect(0,0,64,64);K._dot=new t.CanvasTexture(cv);K._dot.userData.p3dComp=true;}
      const mat=new t.PointsMaterial({size:tipo==='nevoa'?0.7:tipo==='bolha'?0.16:0.2,map:K._dot,vertexColors:true,transparent:true,opacity:tipo==='nevoa'?0.35:0.95,depthWrite:false,blending:tipo==='nevoa'||tipo==='folha'?t.NormalBlending:t.AdditiveBlending,sizeAttenuation:true,toneMapped:false});
      const pts=new t.Points(g,mat);pts.frustumCulled=false;pts.userData.ascAura=true;root.add(pts);
      const sobe=tipo==='folha'?-1:1,vel=tipo==='nevoa'?0.15:tipo==='bolha'?0.3:0.45;
      const tick=tt=>{for(let i=0;i<n;i++){const b=base[i];const f=((tt*vel*b[2]+b[1])%1+1)%1,a=b[0]+tt*(tipo==='confete'?1.4:0.6)*b[2];const r=sx*(tipo==='nevoa'?0.9:0.75+0.35*f);
        const yy=sobe>0?y0+f*hy*1.1:y0+hy*1.1-f*hy*1.1;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=yy;pos[i*3+2]=Math.sin(a)*r*0.8;}
        g.attributes.position.needsUpdate=true;};
      tick(0.7);
      return {tick,pts};
    }
  };
  return K;
})();

