/* ===================== v10: TELAS DOS RALOS =====================
   Vila (aba), Ascensão (folha da carta), Livro de Causos, Mascate (Loja), Economia v10, roda de emotes,
   Olho do Vigia, troca de missão, decks salvos, Rede de Olho, Caderno de Batalha.
   Os ganchos (renderVila, ascHTML, mascateHTML...) são chamados por 80-ui / 60-battle sempre com typeof.
   Os cliques passam por um único ouvinte: [data-rl="ação"]. */

/* ---------- estilo (injetado: o arquivo de estilo é de outro dono) ---------- */
(function rlCSS(){
  if(typeof document==='undefined'||document.getElementById('rl-css'))return;
  const st=document.createElement('style');st.id='rl-css';
  st.textContent=`
.rl-wrap{display:grid;gap:14px;min-width:0}
.rl-wrap>*{min-width:0}
.rl-rye{font-family:'Rye',var(--pix);letter-spacing:.02em;font-weight:400}
.rl-h{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap}
.rl-h h2{font-size:24px;line-height:1.1;margin:0}
.rl-h p{margin:2px 0 0;font-size:13px}
.rl-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;background:var(--panel-2,#342A1E);border:1px solid var(--line,#4D3D2A);font-size:12px;font-weight:800;white-space:nowrap}
.rl-chip.ok{border-color:#5DBB63;color:#BFF0BF}
.rl-chip.novo{background:#3a2a52;border-color:#9085e9;color:#E6E0FF;font-size:10px;padding:1px 6px}
.rl-v{display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
.rl-v svg{flex:none}
.rl-dio{position:relative;border-radius:14px;overflow:hidden;border:2px solid var(--wood-dk,#20140A);background:#120f1c;line-height:0}
.rl-dio svg,.rl-dio canvas{width:100%;height:auto;display:block}
.rl-dio .rl-dio-t{position:absolute;left:10px;top:8px;line-height:1.2;font-size:12px;color:#EADFC8;text-shadow:0 1px 2px #000}
.rl-preds{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));gap:10px}
.rl-pred{position:relative;text-align:left;display:grid;grid-template-columns:44px 1fr;gap:4px 10px;align-items:center;padding:10px 12px 10px 10px;border-radius:12px;background:var(--panel,#2A2219);border:2px solid var(--line,#4D3D2A);border-left:6px solid var(--rc);min-width:0}
.rl-pred:hover{border-color:var(--rc)}
.rl-pred .pi{grid-row:span 2;width:44px;height:44px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--rc) 28%,#15120E)}
.rl-pred b{font-size:15px;display:block;line-height:1.15}
.rl-pred small{display:block;font-size:12px;color:var(--muted,#C1AB89);line-height:1.25}
.rl-pips{display:flex;gap:3px;margin-top:3px}
.rl-pips i{width:14px;height:6px;border-radius:3px;background:#3d3226}
.rl-pips i.on{background:var(--rc)}
.rl-pred .rl-cost{grid-column:2;display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12.5px;margin-top:2px}
.rl-pred.trav{opacity:.62}
.rl-pred .pode{color:#FFE38A;font-weight:800}
.rl-lvls{display:grid;gap:8px}
.rl-lvl{display:grid;grid-template-columns:38px 1fr auto;gap:8px;align-items:center;padding:9px 10px;border-radius:10px;background:var(--panel-2,#342A1E);border:1px solid var(--line,#4D3D2A)}
.rl-lvl .n{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:#211A13;border:2px solid var(--line,#4D3D2A)}
.rl-lvl.rl-feito .n{background:var(--rc);color:#15120E;border-color:var(--rc)}
.rl-lvl.rl-next{border:2px solid var(--rc);background:color-mix(in srgb,var(--rc) 14%,var(--panel-2,#342A1E))}
.rl-lvl.rl-depois{opacity:.55}
.rl-lvl p{margin:0;font-size:13.5px;line-height:1.3}
.rl-lvl small{font-size:12px;color:var(--muted,#C1AB89)}
.rl-cordel{position:relative;padding-top:16px}
.rl-cordel:before{content:'';position:absolute;left:-4px;right:-4px;top:10px;height:2px;background:repeating-linear-gradient(90deg,#B08A5A 0 6px,#8a6a42 6px 9px);border-radius:2px}
.rl-folhetos{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.rl-folh{position:relative;padding:14px 6px 8px;border-radius:4px 4px 6px 6px;background:#E9DDC2;color:#2b2015;text-align:center;border:1px solid #6b5436;box-shadow:0 3px 0 #0006;min-width:0}
.rl-folh:before{content:'';position:absolute;left:50%;top:-9px;width:8px;height:12px;margin-left:-4px;background:#8a6a42;border-radius:2px}
.rl-folh .fc{display:block;height:52px;margin:0 auto 6px;max-width:64px;border:2px solid #2b2015;background:linear-gradient(0deg,var(--rc) var(--p),#cfc2a5 var(--p));position:relative;overflow:hidden}
.rl-folh .fc svg{position:absolute;inset:0;width:100%;height:100%}
.rl-folh b{display:block;font-size:12px;line-height:1.1;font-family:'Rye',var(--pix);font-weight:400}
.rl-folh small{font-size:11px;font-weight:800}
.rl-folh.ok{outline:2px solid #F2BE4A;outline-offset:2px}
.rl-pags{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.rl-pag{position:relative;display:grid;justify-items:center;gap:4px;padding:8px 4px;border-radius:6px;background:#E9DDC2;color:#2b2015;border:1px solid #6b5436;text-align:center;min-width:0}
.rl-pag canvas.art{filter:grayscale(1) contrast(1.6) sepia(.55) brightness(.95);mix-blend-mode:multiply}
.rl-pag.sil canvas.art{filter:brightness(0) opacity(.55)}
.rl-pag b{font-size:11.5px;line-height:1.1;overflow-wrap:anywhere}
.rl-pag small{font-size:11px;font-weight:800}
.rl-pag.trav{opacity:.5}
.rl-causo{background:#E9DDC2;color:#2b2015;border-radius:8px;padding:14px;border:2px solid #6b5436;display:grid;gap:8px}
.rl-causo h3{font-family:'Rye',var(--pix);font-weight:400;font-size:22px;margin:0;line-height:1.1}
.rl-causo .xilo{display:grid;place-items:center;background:#F2EAD7;border:2px solid #2b2015;border-radius:4px;padding:8px;line-height:0}
.rl-causo .xilo canvas.art{width:192px;height:144px;filter:grayscale(1) contrast(1.8) sepia(.5);mix-blend-mode:multiply}
.rl-causo p{margin:0;font-size:15px;line-height:1.5}
.rl-causo .sabia{font-size:13.5px;border-top:1px dashed #6b5436;padding-top:8px}
.rl-causo .reg{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#6b3a14}
.rl-asc{display:grid;gap:8px;width:100%;padding:10px;border-radius:12px;background:var(--panel-2,#342A1E);border:1px solid var(--line,#4D3D2A)}
.rl-asc .ah{display:flex;justify-content:space-between;align-items:center;gap:8px}
.rl-asc .ah b{font-size:15px}
.rl-lad{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;position:relative}
.rl-lad:before{content:'';position:absolute;left:16%;right:16%;top:17px;height:3px;background:#4D3D2A;border-radius:2px}
.rl-node{position:relative;display:grid;justify-items:center;gap:2px;text-align:center;font-size:11.5px;line-height:1.15}
.rl-node .o{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:#211A13;border:3px solid #4D3D2A;font-size:14px;color:#8c7a5e;z-index:1}
.rl-node.rl-feito .o{background:var(--tc);border-color:var(--tc);color:#15120E}
.rl-node.rl-next .o{border-color:var(--tc);color:var(--tc);box-shadow:0 0 0 3px color-mix(in srgb,var(--tc) 30%,transparent)}
.rl-node b{font-size:12px}
.rl-asc .ac{font-size:13px;line-height:1.35}
.rl-asc .note{margin:0}
.rl-tog{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700}
.rl-tog input{width:18px;height:18px;accent-color:var(--gold,#F2BE4A)}
.rl-flame{position:absolute;right:4px;top:4px;z-index:3;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#2a1408;border:1px solid #E8862E;box-shadow:0 0 6px #E8862E}
.rl-masc .cart{display:flex;gap:12px;align-items:center}
.rl-masc .cart svg{flex:none}
.rl-cat{display:grid;gap:8px}
.rl-cat h4{margin:4px 0 0;font-size:15px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.rl-itens{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));gap:8px}
.rl-item{display:grid;gap:6px;justify-items:center;text-align:center;padding:10px 8px;border-radius:10px;background:var(--panel-2,#342A1E);border:1px solid var(--line,#4D3D2A);min-width:0}
.rl-item.usa{border:2px solid var(--gold,#F2BE4A)}
.rl-item b{font-size:13px;line-height:1.15}
.rl-item small{font-size:11.5px;color:var(--muted,#C1AB89);line-height:1.2}
.rl-item .btn{width:100%}
.rl-prev{width:88px;height:64px;display:grid;place-items:center}
.rl-prev svg{width:100%;height:100%}
.rl-bub{display:inline-block;padding:7px 10px;border-radius:12px;background:#F3E7CD;color:#2b2015;font-weight:800;font-size:13px;position:relative}
.rl-bub:after{content:'';position:absolute;left:14px;bottom:-6px;border:6px solid transparent;border-top-color:#F3E7CD;border-bottom:0}
.rl-falta{font-size:11.5px;font-weight:800;color:#FFE38A}
.rl-eco .tiles2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:10px}
.rl-big{font-size:30px;font-weight:800;line-height:1.05;font-variant-numeric:tabular-nums}
.rl-bars{display:grid;gap:8px}
.rl-bar{display:grid;grid-template-columns:76px 1fr auto;gap:8px;align-items:center;font-size:13px}
.rl-bar .tr{height:14px;background:#211A13;border-radius:7px;overflow:hidden}
.rl-bar .tr i{display:block;height:100%;border-radius:0 7px 7px 0}
.rl-stk{display:flex;height:18px;gap:2px;border-radius:9px;overflow:hidden;background:#211A13}
.rl-stk i{display:block;height:100%;min-width:3px}
.rl-leg{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));gap:4px 12px;margin-top:8px;font-size:12.5px}
.rl-leg span{display:flex;align-items:center;gap:6px;min-width:0}
.rl-leg i{width:10px;height:10px;border-radius:3px;flex:none}
.rl-leg b{margin-left:auto;font-variant-numeric:tabular-nums}
.rl-passos{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr));gap:8px}
.rl-passo{text-align:left;display:grid;gap:3px;padding:10px 12px;border-radius:10px;background:var(--panel-2,#342A1E);border:1px solid var(--line,#4D3D2A)}
.rl-passo:hover{border-color:var(--gold,#F2BE4A)}
.rl-passo small{font-size:11.5px;color:var(--muted,#C1AB89);text-transform:uppercase;letter-spacing:.04em;font-weight:800}
.rl-passo b{font-size:14px;line-height:1.2}
.rl-spark{width:100%;max-width:420px;height:auto;display:block;margin:0 auto}
.rl-ttip{position:fixed;z-index:9999;pointer-events:none;padding:6px 9px;border-radius:8px;background:#0d0b08;border:1px solid #4D3D2A;color:#F3E7CD;font-size:12px;line-height:1.3;max-width:220px}
.rl-emo{position:fixed;z-index:60;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px;border-radius:14px;background:var(--panel,#2A2219);border:2px solid var(--wood-dk,#20140A);box-shadow:0 8px 24px #000a;max-width:min(92vw,280px)}
.rl-emo .btn{white-space:nowrap}
.rl-emo p{grid-column:1/-1;margin:0;font-size:12px}
.rl-fala{position:fixed;z-index:61;pointer-events:none;max-width:min(80vw,260px)}
.rl-vig{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:var(--panel-2,#342A1E);border:1px dashed #E8862E;font-size:13px;line-height:1.25;margin-top:8px;max-width:100%}
.rl-vig small{display:block;font-size:11px;color:var(--muted,#C1AB89)}
.rl-decks{display:grid;gap:6px;margin-top:8px}
.rl-dk{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;padding:7px 9px;border-radius:9px;background:var(--panel-2,#342A1E);border:1px solid var(--line,#4D3D2A);font-size:13px}
.rl-dk.trav{opacity:.55}
.rl-dk b{display:block}
.rl-dk small{color:var(--muted,#C1AB89);font-size:11.5px}
.rl-wl{display:grid;gap:6px}
.rl-wr{display:grid;grid-template-columns:40px 1fr auto auto;gap:8px;align-items:center;font-size:13px}
.rl-diar{display:grid;gap:6px}
.rl-diar details{background:var(--panel-2,#342A1E);border-radius:9px;padding:7px 10px;border:1px solid var(--line,#4D3D2A)}
.rl-diar summary{cursor:pointer;font-weight:800;font-size:13px}
.rl-diar .lg{max-height:220px;overflow:auto;font-size:12.5px;display:grid;gap:2px;margin-top:6px}
.rl-stamp{position:fixed;left:50%;top:42%;z-index:9998;transform:translate(-50%,-50%) rotate(-8deg);padding:10px 22px;border:4px solid #F3E7CD;border-radius:8px;color:#F3E7CD;background:#2b1a0dcc;font-family:'Rye',var(--pix);font-size:30px;pointer-events:none;white-space:nowrap;box-shadow:0 0 0 3px #2b1a0d}
.rl-sel{width:100%;padding:8px;border-radius:8px;background:#211A13;color:var(--ink,#F3E7CD);border:1px solid var(--line,#4D3D2A);font:inherit}
.rl-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.rl-sec-t{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
@media (min-width:900px){.rl-two{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;align-items:start}}
@media (max-width:420px){.rl-folh b{font-size:10.5px}.rl-folh .fc{height:44px}.rl-big{font-size:26px}}
`;
  (document.head||document.documentElement).appendChild(st);
})();

/* ---------- ícones (usa os do 30-gfx quando existirem) ---------- */
const RL_SVG={
 vintem:'<circle cx="12" cy="12" r="9" fill="#B9773A" stroke="#5a3415" stroke-width="2"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#E8B06A" stroke-width="1"/><rect x="9.6" y="9.6" width="4.8" height="4.8" fill="#2a1a0c"/><path d="M17 6.2l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.3.7.3-1.4-1-1 1.4-.2z" fill="#FFE3A6"/>',
 brasa:'<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.3-4.8C10.5 7 11.7 5.6 12 3z" fill="#E8862E"/><path d="M12 9c.6 1.8 2.6 3 2.6 5.4a2.6 2.6 0 0 1-5.2 0c0-1.6 1.6-2.8 2.6-5.4z" fill="#FFD35A"/><circle cx="18" cy="5" r="1.2" fill="#FFB23D"/>',
 fogueira:'<path d="M5 19l14-4M5 15l14 4" stroke="#6B4427" stroke-width="2.6" stroke-linecap="round"/><path d="M12 2.5c1.2 3 4.4 4.6 4.4 8.6a4.4 4.4 0 0 1-8.8 0c0-1.9 1-3.1 2-4.2 1-1.1 2-2.3 2.4-4.4z" fill="#E8862E"/><path d="M12 7.5c.5 1.6 2.2 2.6 2.2 4.6a2.2 2.2 0 0 1-4.4 0c0-1.4 1.4-2.4 2.2-4.6z" fill="#FFD35A"/>',
 torre:'<path d="M8 21l1.4-12h5.2L16 21z" fill="#8E5F38"/><path d="M6.5 9.2L12 3.5l5.5 5.7z" fill="#C4632B"/><rect x="10.6" y="11" width="2.8" height="3" fill="#FFD35A"/>',
 casa:'<path d="M4 20v-8l8-6 8 6v8z" fill="#8E5F38"/><path d="M2.5 12.5L12 5l9.5 7.5" stroke="#C9A35A" stroke-width="2.2" fill="none"/><rect x="10" y="14" width="4" height="6" fill="#2a1a0c"/><path d="M16.5 6c0-1.5 1-2 1-3.2M18.6 6.4c0-1.3.9-1.8.9-3" stroke="#c9c2b5" stroke-width="1.2" fill="none"/>',
 barco:'<path d="M3 14h18l-3 5H6z" fill="#8E5F38"/><path d="M12 4v9M12 4l6 8h-6" fill="#E9DDC2" stroke="#E9DDC2" stroke-width="1"/><path d="M2 21c2-1.2 4-1.2 6 0s4 1.2 6 0 4-1.2 6 0" stroke="#2E9FB5" stroke-width="1.6" fill="none"/>',
 lua:'<path d="M15.5 3.5A8.5 8.5 0 1 0 20.5 15 7 7 0 0 1 15.5 3.5z" fill="#C9C2F2"/>',
 livro:'<path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1V19c-3-1-6-1-9 1-3-2-6-2-9-1z" fill="#E9DDC2" stroke="#6b5436" stroke-width="1.2"/><path d="M12 6.5V20" stroke="#6b5436" stroke-width="1.2"/>',
 carroca:'<rect x="3" y="8" width="13" height="7" rx="1" fill="#8E5F38"/><path d="M3 8l2-3h9l2 3" fill="#C4632B"/><circle cx="7" cy="17" r="3" fill="none" stroke="#C9A35A" stroke-width="2"/><path d="M16 12h5" stroke="#6B4427" stroke-width="2"/>',
 olho:'<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" fill="#E9DDC2"/><circle cx="12" cy="12" r="3.4" fill="#2a1a0c"/><circle cx="13" cy="11" r="1" fill="#fff"/>',
 chama:'<path d="M12 2.5c1.4 3.4 5.4 5.4 5.4 10.4a5.4 5.4 0 0 1-10.8 0c0-2.4 1.3-3.9 2.5-5.2C10.3 6.4 11.5 5 12 2.5z" fill="#E8862E"/><path d="M12 9c.6 1.8 2.6 3 2.6 5.4a2.6 2.6 0 0 1-5.2 0c0-1.6 1.6-2.8 2.6-5.4z" fill="#FFD35A"/>',
 troca:'<path d="M5 9a7 7 0 0 1 12.5-2.5M19 15a7 7 0 0 1-12.5 2.5" stroke="#F3E7CD" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M18.5 3v4.2h-4.2M5.5 21v-4.2h4.2" stroke="#F3E7CD" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
};
function rlIc(n,px){
  px=px||18;
  if(typeof VICONS!=='undefined'&&VICONS[n]||typeof ICONS!=='undefined'&&ICONS[n])return ic(n,px);
  return `<svg viewBox="0 0 24 24" width="${px}" height="${px}" aria-hidden="true" focusable="false" style="vertical-align:middle;flex:none">${RL_SVG[n]||RL_SVG.chama}</svg>`;
}
const rlV=(n,px)=>`<span class="rl-v">${rlIc('vintem',px||16)}<b class="num">${fmt(n)}</b></span>`;
const rlB=(n,px)=>`<span class="rl-v">${rlIc('brasa',px||16)}<b class="num">${fmt(n)}</b></span>`;
const rlLug=(k,d)=>{const T=_TM();return T&&T.lugares&&T.lugares[k]||d;};
const rlCorReino=r=>(typeof TERR_COR!=='undefined'&&TERR_COR[r])||'#B08A5A';
function sfxR(n,alt){try{if(typeof SFX!=='undefined'&&SFX[n])sfx(n);else if(alt)sfx(alt);}catch(e){}}
function rlCarimbo(txt){
  sfxR('carimbo','levelup');
  const el=document.createElement('div');el.className='rl-stamp';el.textContent=txt;document.body.appendChild(el);
  if(!RM&&el.animate)el.animate([{transform:'translate(-50%,-50%) rotate(-8deg) scale(2.2)',opacity:0},{transform:'translate(-50%,-50%) rotate(-8deg) scale(.94)',opacity:1,offset:.35},{transform:'translate(-50%,-50%) rotate(-8deg) scale(1)',opacity:1,offset:.8},{opacity:0,transform:'translate(-50%,-50%) rotate(-8deg) scale(1.02)'}],{duration:1300,easing:'ease-out'});
  setTimeout(()=>el.remove(),RM?700:1300);
}
/* folhas dos ralos: guardam a função de desenho para redesenhar depois de cada ação */
const RL_FOLHAS=new Set();
function rlFolha(titulo,draw,o){
  o=o||{};
  const ov=abrirFolha('',{titulo,cls:o.cls||'',onClose:()=>{RL_FOLHAS.delete(ov);if(o.onClose)o.onClose();}});
  ov._rlDraw=()=>{const b=$('.sbody',ov);if(!b)return;b.innerHTML=draw();hydrateGfx(b);if(o.depois)o.depois(b);};
  ov._rlDraw();RL_FOLHAS.add(ov);return ov;
}
function rlRedesenhar(){
  for(const ov of [...RL_FOLHAS]){if(!ov.isConnected){RL_FOLHAS.delete(ov);continue;}ov._rlDraw();}
  $$('[data-asc-box]').forEach(b=>{const id=b.dataset.ascBox;const h=ascHTML(id);if(h){b.outerHTML=h;}});
  if(typeof refresh==='function')refresh();
}

/* ===================== VILA ===================== */
function renderVila(m){
  const f=nivelVila('fogueira'),tot=totalVila();
  const nomeV=rlLug('vilaNome','Vila das Lendas');
  const preds=VILA_ORDEM.map(p=>predioHTML(p)).join('');
  const causos=causosPainelHTML();
  const extra=[temRedeDeOlho()?redeHTML():'',temCaderno()?cadernoHTML():'',visualHTML()].join('');
  m.innerHTML=`<div class="rl-wrap rl-vila">
   <section class="panel"><div class="rl-h"><div><h2 class="rl-rye">${escH(nomeV)}</h2><p class="muted">${f?'Cada nível queima Vinténs na fogueira: eles somem da economia e a Vila cresce para sempre.':'Acenda a Fogueira para abrir a Vila. Cada nível queima Vinténs e fica para sempre.'}</p></div>
    <div class="rl-row"><span class="rl-chip">${rlIc('fogueira',14)} Níveis <b class="num">${tot}/25</b></span><span class="rl-chip">${rlIc('livro',14)} Causos <b class="num">${causosLidos()}/${COLECAO.length}</b></span></div></div></section>
   <div class="rl-two"><div class="rl-wrap">
    <div class="rl-dio" id="rlDio" aria-label="A Vila das Lendas: ${VILA_ORDEM.map(p=>VILA_PREDIOS[p].nome+' nível '+nivelVila(p)).join(', ')}" role="img"></div>
    <section class="panel"><div class="ph"><h3>Construções</h3><span class="muted" style="font-size:12px">Toque para ver os 5 níveis</span></div><div class="rl-preds">${preds}</div></section>
   </div><div class="rl-wrap">${causos}${extra}</div></div>
  </div>`;
  const dio=$('#rlDio',m);
  if(typeof vila3dMontar==='function'){const cv=document.createElement('canvas');cv.width=720;cv.height=400;dio.appendChild(cv);try{vila3dMontar(cv,s.vila);}catch(e){dio.innerHTML='';vila2d(dio);}}
  else vila2d(dio);
}
function predioHTML(p){
  const P=VILA_PREDIOS[p],n=nivelVila(p),r=podeVila(p),c=custoVila(p),rc=rlCorReino(P.reino);
  const prox=n<5?VILA_PREMIO[p][n]:null;
  const trav=!r.ok&&(r.trava==='arena'||r.trava==='fogueira');
  const linha=n>=5?'<span class="okmsg">Completa!</span>':trav?`<span>${rlIc('chama',12)} ${escH(r.motivo)}</span>`:`<span>${rlV(c,14)}</span>${r.ok?'<span class="pode">pode subir!</span>':`<span class="rl-falta">faltam ${fmt(c-s.grao)}</span>`}`;
  return `<button class="rl-pred ${trav?'trav':''}" style="--rc:${rc}" data-rl="predio" data-p="${p}" data-k="rl-pred-${p}" aria-label="${escH(P.nome)}, nível ${n} de 5${prox?'. Próximo: '+escH(prox.t):''}">
   <span class="pi">${rlIc(P.ic,28)}</span><span><b>${escH(P.nome)}</b><span class="rl-pips" aria-hidden="true">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span></span>
   <span class="rl-cost" style="grid-column:1/-1;display:block"><small>${prox?'Nv '+(n+1)+': '+escH(prox.t):'Todos os níveis feitos'}</small></span>
   <span class="rl-cost" style="grid-column:1/-1">${linha}</span></button>`;
}
function abrirPredio(p){
  const P=VILA_PREDIOS[p],rc=rlCorReino(P.reino);
  rlFolha(P.nome,()=>{
    const n=nivelVila(p),r=podeVila(p);
    const lv=VILA_PREMIO[p].map((x,i)=>{const st=i<n?'rl-feito':i===n?'rl-next':'rl-depois';
      return `<div class="rl-lvl ${st}" style="--rc:${rc}"><span class="n num">${i<n?'✓':i+1}</span><div><p><b>${escH(x.t)}</b></p>${x.d?`<small>${escH(x.d)}</small>`:''}</div><span class="num" style="font-size:13px">${i<n?'':rlV(VILA_CUSTO[i],14)}</span></div>`;}).join('');
    const btn=n>=5?'<p class="okmsg">Construção completa!</p>':`<button class="btn gold md wide" data-rl="subir" data-p="${p}" ${r.ok?'':'disabled'}>Subir para o Nv ${n+1} · ${rlV(VILA_CUSTO[n],16)}</button>${r.ok?'':`<p class="note">${escH(r.motivo)}</p>`}`;
    const gate=p==='fogueira'?'<p class="muted" style="font-size:12px">A Fogueira puxa a Vila: as outras construções vão até o nível da Fogueira + 1.</p>':`<p class="muted" style="font-size:12px">Vai até o nível da Fogueira + 1${P.arena>1?' · abre na Arena '+P.arena:''}.</p>`;
    return `<div class="rl-wrap"><div class="rl-lvls">${lv}</div>${gate}<div class="acts" style="width:100%">${btn}</div><p class="muted" style="font-size:11.5px">Os Vinténs vão para a fogueira: saem da economia. Moeda simulada, sem dinheiro real.</p></div>`;
  });
}
/* diorama 2D (sem WebGL): cada nível acrescenta um passo visível */
function vila2d(el){
  const L=p=>nivelVila(p);const f=L('fogueira');
  const P=[{p:'sertao',x:70,y:118},{p:'mata',x:290,y:118},{p:'aguas',x:250,y:170},{p:'noite',x:110,y:170}];
  const pred=(o)=>{const n=L(o.p),c=rlCorReino(VILA_PREDIOS[o.p].reino),x=o.x,y=o.y;let g='';
    g+=`<ellipse cx="${x}" cy="${y+2}" rx="34" ry="8" fill="#0006"/>`;
    if(n===0)return g+`<rect x="${x-24}" y="${y-30}" width="48" height="30" fill="none" stroke="#6d5a44" stroke-dasharray="4 3" stroke-width="1.5"/><text x="${x}" y="${y-11}" text-anchor="middle" font-size="9" fill="#9c8a70">terreno</text>`;
    // Nv1: alicerce e esteios
    g+=`<rect x="${x-26}" y="${y-4}" width="52" height="6" fill="#5b4632"/>`;
    if(n===1)g+=`<path d="M${x-22} ${y-4}v-28M${x+22} ${y-4}v-28M${x-24} ${y-30}h48M${x-22} ${y-30}l22-16 22 16" stroke="#9a7346" stroke-width="3" fill="none"/>`;
    if(n>=2){
      if(o.p==='sertao')g+=`<rect x="${x-14}" y="${y-48}" width="28" height="44" fill="#8E5F38"/><path d="M${x-20} ${y-48}l20-18 20 18z" fill="#C4632B"/>`;
      else if(o.p==='mata')g+=`<rect x="${x-26}" y="${y-30}" width="52" height="26" fill="#9a6a3c"/><path d="M${x-32} ${y-30}l32-20 32 20z" fill="#C9A35A"/>`;
      else if(o.p==='aguas')g+=`<path d="M${x-30} ${y-2}h60v-4h-60z" fill="#6B4427"/><rect x="${x-18}" y="${y-28}" width="36" height="22" fill="#8a6a42"/><path d="M${x-24} ${y-28}l24-14 24 14z" fill="#6f5b3f"/>`;
      else g+=`<rect x="${x-12}" y="${y-44}" width="24" height="40" fill="#5a4a6a"/><path d="M${x-18} ${y-44}h36l-18-16z" fill="#3c3052"/>`;
      g+=`<rect x="${x-4}" y="${y-18}" width="8" height="14" fill="#2a1a0c"/>`;
    }
    if(n>=3){
      if(o.p==='sertao')g+=`<path d="M${x-4} ${y-62}a4 4 0 0 1 8 0v4h-8z" fill="#F2BE4A"/>`;
      else if(o.p==='mata')g+=`<rect x="${x+14}" y="${y-48}" width="7" height="14" fill="#6b4427"/><path d="M${x+17} ${y-50}c-4-6 4-8 0-14M${x+21} ${y-52}c-3-5 3-7 0-12" stroke="#cfc6b8" stroke-width="2" fill="none" opacity=".8"/>`;
      else if(o.p==='aguas')g+=`<path d="M${x+30} ${y+6}q12 6 24 0l-3 5h-18z" fill="#8E5F38"/>`;
      else g+=`<path d="M${x+6} ${y-52}l14-8" stroke="#C9C2F2" stroke-width="3"/><circle cx="${x+26}" cy="${y-66}" r="7" fill="#E6E0FF"/>`;
    }
    if(n>=4){g+=`<rect x="${x-9}" y="${y-26}" width="6" height="6" fill="#FFD35A"/><rect x="${x+3}" y="${y-26}" width="6" height="6" fill="#FFD35A"/><path d="M${x-30} ${y-34}q15 8 30 0t30 0" stroke="${c}" stroke-width="2" fill="none"/>`;
      for(let i=0;i<5;i++)g+=`<path d="M${x-26+i*13} ${y-32+(i%2)}l4 7 4-7z" fill="${c}"/>`;}
    if(n>=5)g+=`<circle cx="${x}" cy="${y-20}" r="40" fill="${c}" opacity=".16"/><path d="M${x+30} ${y-2}c0-10 6-12 6-20 3 6 6 10 6 20z" fill="${c}"/>`;
    return g;};
  const chamas=f===0?'':[0,1,2,3].slice(0,Math.max(1,f>=5?4:1)).map((k,i)=>{const cs=f>=5?['#E8862E','#3FA34D','#2E9FB5','#7B5BD6']:['#E8862E'];const c=cs[i%cs.length];const dx=(i-(f>=5?1.5:0))*8;const h=12+f*4;
    return `<path d="M${180+dx} ${140-h}c3 ${h*0.4} 10 ${h*0.55} 10 ${h*0.8}a10 10 0 0 1-20 0c0-${h*0.35} 7-${h*0.5} 10-${h*0.8}z" fill="${c}" opacity=".92"/>`;}).join('')+`<path d="M${180-5} ${140-6-f*2}c2 4 6 6 6 10a6 6 0 0 1-12 0c0-3 4-6 6-10z" fill="#FFD35A"/>`;
  const fog=`<ellipse cx="180" cy="146" rx="${30+f*4}" ry="9" fill="${f?'#E8862E':'#000'}" opacity="${f?0.18+f*0.03:0.3}"/><path d="M160 150l40-10M160 140l40 10" stroke="#6B4427" stroke-width="5" stroke-linecap="round"/>${chamas}${f===0?'<text x="180" y="128" text-anchor="middle" font-size="10" fill="#c9b796">acenda a fogueira</text>':''}`;
  const band=f>=4?[0,1,2,3,4,5,6,7].map(i=>`<path d="M${40+i*35} 64l6 10 6-10z" fill="${['#E8862E','#3FA34D','#2E9FB5','#7B5BD6'][i%4]}"/>`).join('')+'<path d="M30 62q150 26 300 0" stroke="#c9b796" stroke-width="1" fill="none"/>':'';
  const stars=[[30,20],[80,40],[120,14],[200,26],[260,12],[320,36],[340,16],[160,48],[300,58]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.2" fill="#E6E0FF" opacity=".8"/>`).join('');
  el.innerHTML=`<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="rlCeu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151230"/><stop offset=".6" stop-color="#2a1d3a"/><stop offset="1" stop-color="#3a2416"/></linearGradient><radialGradient id="rlChao" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#5a3c22"/><stop offset="1" stop-color="#22160c"/></radialGradient></defs>
   <rect width="360" height="200" fill="url(#rlCeu)"/>${stars}<circle cx="318" cy="34" r="12" fill="#F3E7CD" opacity=".9"/><circle cx="313" cy="31" r="12" fill="#2a1d3a" opacity=".35"/>
   <path d="M0 96l40-14 50 10 60-18 70 14 60-12 80 14v110H0z" fill="#1d1426"/>
   <ellipse cx="180" cy="150" rx="178" ry="52" fill="url(#rlChao)"/>${band}
   ${P.slice(0,2).map(pred).join('')}${fog}${P.slice(2).map(pred).join('')}</svg>
   <div class="rl-dio-t"><span>${totalVila()}/25 níveis</span></div>`;
}

/* ---------- Livro de Causos ---------- */
const FOLH_NOME={milharal:'Sertão',pomar:'Mata',brejo:'Águas',pasto:'Noite',neutro:'Arraial'};
const folhNome=r=>(typeof TERR_NOME!=='undefined'&&TERR_NOME[r])||FOLH_NOME[r];
function causosPainelHTML(){
  return `<section class="panel"><div class="ph"><h3 class="rl-rye" style="font-size:19px">${escH(rlLug('causos','Livro de Causos'))}</h3><span class="muted num" style="font-size:12px">${causosLidos()}/${COLECAO.length} páginas</span></div>
   <p class="muted" style="font-size:12.5px;margin:0 0 6px">Cinco folhetos de cordel, um por reino. Cada página conta o causo de uma lenda da sua coleção.</p>
   <div class="rl-cordel"><div class="rl-folhetos">${FOLHETOS.map(r=>{const pg=paginasDe(r),l=pg.filter(c=>causoLido(c.id)).length,ok=folhetoCompleto(r);
     return `<button class="rl-folh ${ok?'ok':''}" style="--rc:${rlCorReino(r)};--p:${Math.round(l/pg.length*100)}%" data-rl="folheto" data-r="${r}" data-k="rl-folh-${r}" aria-label="Folheto ${escH(folhNome(r))}: ${l} de ${pg.length} páginas"><span class="fc">${xiloCapa(r)}</span><b>${escH(folhNome(r))}</b><small class="num">${l}/${pg.length}</small></button>`;}).join('')}</div></div></section>`;
}
function xiloCapa(r){
  const m={milharal:'<path d="M12 4c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 3-5 6-11z"/>',pomar:'<path d="M12 21V9M12 12c-4 0-6-3-6-6 4 0 6 3 6 6zm0 3c4 0 6-3 6-6-4 0-6 3-6 6z"/>',brejo:'<path d="M3 14c3-3 6-3 9 0s6 3 9 0M3 19c3-3 6-3 9 0s6 3 9 0M12 4l3 6H9z"/>',pasto:'<path d="M15 4a8 8 0 1 0 5 12 6.5 6.5 0 0 1-5-12z"/>',neutro:'<path d="M5 20l14-4M5 16l14 4M12 4c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 2-4 4-8z"/>'};
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#2b2015" stroke="#2b2015" stroke-width=".8" opacity=".85">${m[r]}</g></svg>`;
}
function abrirFolheto(r){
  rlFolha('Folheto '+folhNome(r),()=>{
    const pg=paginasDe(r),l=pg.filter(c=>causoLido(c.id)).length;
    const pr=FOLHETOS.map(x=>x);void pr;
    return `<div class="rl-wrap"><div class="rl-sec-t"><span class="muted" style="font-size:13px">${l}/${pg.length} páginas lidas</span>${folhetoCompleto(r)?`<span class="rl-chip ok">✓ Moldura de Cordel e título "Cordelista ${escH(REINO_DE[r])}"</span>`:`<span class="rl-chip">Prêmio: Moldura de Cordel + título</span>`}</div>
     <div class="rl-pags">${pg.slice().sort((a,b)=>rIdx(a.rar)-rIdx(b.rar)||CARD_ORDER[a.id]-CARD_ORDER[b.id]).map(c=>{const lido=causoLido(c.id),tem=!!s.cards[c.id],pre=CAUSO_PRECO[c.rar];
       return `<button class="rl-pag ${lido?'':'sil'} ${!lido&&!tem?'trav':''}" data-rl="pagina" data-id="${c.id}" aria-label="${escH(c.nome)}: ${lido?'lido':tem?'comprar por '+pre+' Vinténs':'só para cartas da sua coleção'}">${artCanvas(c.id,{dark:!lido&&!tem})}<b>${escH(lido||tem?c.nome:'???')}</b><small>${lido?'Ler':tem?rlV(pre,13):'falta a carta'}</small></button>`;}).join('')}</div>
     <p class="muted" style="font-size:12px">Página de comum 30 · incomum 45 · rara 70 · épica 110 · lendária 160 Vinténs. Só para cartas que você tem. Completar o folheto dá a Moldura de Cordel ${escH(REINO_DE[r])}; os 5 folhetos dão o visual "Contador de Causos" e o verso "Xilogravura".</p></div>`;
  },{cls:'rl-sheet-folheto'});
}
function causoTexto(id){
  const T=_TM();const k=T&&T.causos&&T.causos[id];const C=CARD[id];
  return {regiao:k&&k.regiao||folhNome(C.terreno),texto:k&&k.texto||C.sabor||'',sabia:k&&k.sabia||''};
}
function xiloHTML(id,w,h){
  if(typeof retratoXilo==='function'){try{const r=retratoXilo(id,w,h);if(typeof r==='string')return r;if(r&&r.nodeType){const tmp=document.createElement('div');tmp.appendChild(r);return tmp.innerHTML;}}catch(e){}}
  return artCanvas(id);
}
function abrirPagina(id){
  const C=CARD[id];
  if(!causoLido(id)){
    const r=podeLerCauso(id);
    if(!s.cards[id]){toast('Esse causo abre quando a carta entrar na sua coleção.');return;}
    rlFolha(C.nome,()=>{const r2=podeLerCauso(id);return `<div class="rl-wrap"><div class="rl-causo"><span class="reg">${escH(causoTexto(id).regiao)}</span><h3>${escH(C.nome)}</h3><div class="xilo"><span style="filter:brightness(0) opacity(.5)">${artCanvas(id)}</span></div><p class="muted" style="color:#5a4630">Uma página de cordel sobre esta lenda, com um causo e um "Você sabia?".</p></div>
      <button class="btn gold md wide" data-rl="lercauso" data-id="${id}" ${r2.ok?'':'disabled'}>Comprar a página · ${rlV(CAUSO_PRECO[C.rar],16)}</button>${r2.ok?'':`<p class="note">${escH(r2.motivo)}</p>`}<p class="muted" style="font-size:11.5px">Os Vinténs vão para a fogueira e a página fica sua para sempre.</p></div>`;});
    void r;return;
  }
  const t=causoTexto(id);
  rlFolha(C.nome,()=>`<div class="rl-causo"><span class="reg">${escH(t.regiao)}</span><h3>${escH(C.nome)}</h3><div class="xilo">${xiloHTML(id,192,144)}</div><p>${escH(t.texto)}</p>${t.sabia?`<p class="sabia"><b>Você sabia?</b> ${escH(t.sabia)}</p>`:''}</div>`);
}

/* ---------- Rede de Olho, Caderno, Seu visual (painéis da Vila) ---------- */
function redeHTML(){
  const ids=Object.keys(s.vigiaFeira);
  const opts=COLECAO.filter(c=>!s.vigiaFeira[c.id]&&liberadaNoMercado(c.id)).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')).map(c=>`<option value="${c.id}">${escH(c.nome)} · ${fmt(preco(c.id))}</option>`).join('');
  return `<section class="panel"><div class="ph"><h3>Rede de Olho</h3><span class="muted num" style="font-size:12px">${ids.length}/${VIGIA_MAX}</span></div>
   <p class="muted" style="font-size:12.5px;margin:0 0 8px">Avisa quando o preço na ${escH(rlLug('mercado','Feira'))} cai abaixo da sua marca.</p>
   <div class="rl-wl">${ids.map(id=>{const w=s.vigiaFeira[id],p=preco(id);return `<div class="rl-wr">${artCanvas(id,{crop:true})}<span><b>${escH(CARD[id].nome)}</b><br><small class="muted">agora ${fmt(p)} · marca ${fmt(w.marca)}</small></span>${typeof sparkSVG==='function'?sparkSVG(w.h||[]):''}<button class="ibtn" data-rl="desvigiar" data-id="${id}" aria-label="Parar de vigiar ${escH(CARD[id].nome)}">✕</button></div>`;}).join('')||'<p class="muted" style="font-size:13px">Nenhuma carta vigiada.</p>'}</div>
   ${ids.length<VIGIA_MAX?`<div class="rl-row" style="margin-top:8px"><select class="rl-sel" id="rlVigSel" aria-label="Carta para vigiar" style="flex:1 1 160px">${opts}</select><button class="btn small" data-rl="vigiar">Vigiar (marca −10%)</button></div>`:''}</section>`;
}
function cadernoHTML(){
  const D=s.diarios||[];
  const res=x=>x==='vitoria'?'Vitória':x==='derrota'?'Derrota':'Empate';
  return `<section class="panel"><div class="ph"><h3>Caderno de Batalha</h3><span class="muted num" style="font-size:12px">${D.length}/5</span></div><div class="rl-diar">${D.map((d,i)=>`<details><summary>${res(d.res)} · ${escH(RIVAIS[d.rival]?RIVAIS[d.rival].curto||RIVAIS[d.rival].nome:d.rival)} <span class="muted num" style="font-weight:600">· ${new Date(d.t).toLocaleDateString('pt-BR')} ${new Date(d.t).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></summary><div class="lg">${d.log.map(t=>`<div>${escH(t)}</div>`).join('')}</div></details>`).join('')||'<p class="muted" style="font-size:13px">Os Diários das próximas partidas ficam aqui.</p>'}</div></section>`;
}
function visualHTML(){
  const U=s.cosm.usa;
  const tit=cosmDaCat('titulo').filter(x=>temCosm(x.id)),ac=cosmDaCat('acessorio').filter(x=>temCosm(x.id)),he=cosmDaCat('heroi').filter(x=>temCosm(x.id));
  const fita=fitaAtual();
  const sel=(slot,l,vazio)=>`<select class="rl-sel" data-rl-sel="${slot}" aria-label="${escH(vazio)}"><option value="">${escH(vazio)}</option>${l.map(x=>`<option value="${x.id}" ${U[slot]===x.id?'selected':''}>${escH(x.nome)}</option>`).join('')}</select>`;
  return `<section class="panel"><div class="ph"><h3>Seu visual</h3>${fita?`<span class="rl-chip" style="border-color:${fita.cor}">${escH(fita.nome)}</span>`:''}</div>
   <div style="display:grid;gap:8px;font-size:13px">
    <label>Título ${sel('titulo',tit,'Sem título')}</label>
    <label>Visual do herói ${sel('heroi',he,'Andarilho das Lendas')}</label>
    ${ac.length?`<label>Acessório ${sel('acessorio',ac,'Sem acessório')}</label>`:''}
    <label class="rl-tog"><input type="checkbox" data-rl-chk="emoteMudo" ${s.cosm.emoteMudo?'checked':''}> Silenciar emotes na batalha</label>
    <p class="muted" style="font-size:11.5px;margin:0">Títulos vêm da Vila (Nv 5) e do Livro de Causos; Fitas, dos títulos da Peleja (1, 3, 10 e 25). Molduras, versos e tabuleiros você escolhe no Mascate, na Loja.</p>
   </div></section>`;
}

/* ===================== ASCENSÃO (folha da carta) ===================== */
const ASC_COR=['#C68A4A','#C9D1D9','#F2BE4A'];
function ascHTML(id){
  const c=s.cards[id],C=CARD[id];if(!c||!C||C.ficha)return '';
  const tier=c.asc|0,k=custoAscensao(id),p=podeAscender(id);const N=ASC_NOME(),G=ASC_GLIFO();
  const nodes=[0,1,2].map(i=>{const st=i<tier?'rl-feito':i===tier?'rl-next':'';return `<div class="rl-node ${st}" style="--tc:${ASC_COR[i]}"><span class="o" aria-hidden="true">${G[i]}</span><b>${['I','II','III'][i]} · ${escH(N[i])}</b><span class="muted">Nv ${ASC_NV_MIN[i]}+</span></div>`;}).join('');
  let corpo='';
  if(!k)corpo='<p class="okmsg" style="margin:0">Lenda Viva! Forma completa.</p>';
  else{
    const cop=k.cop?`${k.cop} ${k.cop>1?'cópias':'cópia'}`:'nenhuma cópia';
    const falt=[];if(s.grao<k.grao)falt.push(`faltam ${fmt(k.grao-s.grao)} Vinténs`);if(k.falta&&s.po<k.po)falt.push(`${k.falta>1?'faltam':'falta'} ${k.falta} ${k.falta>1?'cópias':'cópia'} (ou ${fmt(k.po-s.po)} ${PO_NOME(2)})`);
    corpo=`<div class="ac">Próximo: <b>${['I','II','III'][k.tier-1]} · ${escH(N[k.tier-1])}</b><br>Custo: ${rlV(k.grao,14)} + ${cop}${k.falta?`<br><span class="muted">Você tem ${k.usa}; ${k.falta>1?'as '+k.falta+' que faltam saem':'a que falta sai'} por ${rlB(k.po,13)}</span>`:''}</div>
     ${!k.nvOk?`<p class="note">Chegue ao Nv ${k.nvMin} para liberar.</p>`:falt.length?`<p class="rl-falta" style="margin:0">${falt.join(' · ')}</p>`:''}
     <button class="btn gold md wide" data-rl="ascender" data-id="${id}" ${p.ok?'':'disabled'}>Ascender: ${escH(N[k.tier-1])}</button>`;
  }
  return `<div class="rl-asc" data-asc-box="${id}"><div class="ah"><b>${rlIc('chama',16)} Ascensão</b><span class="muted" style="font-size:11.5px">só visual · não muda ATK nem vida</span></div>
   <div class="rl-lad" role="list" aria-label="Ascensão: tier ${tier} de 3">${nodes}</div>${corpo}
   ${tier?`<label class="rl-tog"><input type="checkbox" data-rl-chk="ascOff" data-id="${id}" ${c.ascOff?'checked':''}> Mostrar forma básica</label>`:''}</div>`;
}
function ascLigar(el,id){/* os cliques passam pelo ouvinte global [data-rl]; nada a ligar */return !!(el&&id);}
/* selo de chama na grade de Cartas: o próximo tier já dá para comprar */
function ascBadgeHTML(id){return s.cards[id]&&podeAscender(id).ok?`<span class="rl-flame" aria-label="pode ascender">${rlIc('chama',14)}</span>`:'';}
const ascGlifoNome=id=>{const t=ascDe(id);return t?ASC_GLIFO()[t-1]+' ':''};

/* ===================== MASCATE (seção da Loja) ===================== */
function mascateHTML(){
  const nTem=MASCATE.filter(x=>s.cosm.tem[x.id]).length;
  const cats=MASCATE_CATS.map(C=>{
    const its=cosmDaCat(C.k).filter(x=>x.preco||temCosm(x.id)).sort((a,b)=>(a.preco||0)-(b.preco||0));
    const loja=MASCATE.filter(x=>x.cat===C.k);const tem=loja.filter(x=>s.cosm.tem[x.id]).length;
    const barato=loja.filter(x=>!s.cosm.tem[x.id]).sort((a,b)=>a.preco-b.preco)[0];
    return `<div class="rl-cat"><h4>${escH(C.nome)} <span class="rl-chip num">você tem ${tem}/${loja.length}</span></h4><div class="rl-itens">${its.map(x=>itemHTML(x,barato&&barato.id===x.id)).join('')}</div></div>`;}).join('');
  return `<section class="panel rl-masc" id="mascate" aria-label="Mascate"><div class="cart">${carroSVG()}<div><h2 class="rl-rye" style="margin:0;font-size:22px">${escH(rlLug('mascate','Mascate'))}</h2><p class="muted" style="font-size:12.5px;margin:2px 0 0">Catálogo fixo, para sempre: sem sorteio, sem relógio. O que você compra é só seu (não vai para a Feira). Cada Vintém vai para a fogueira.</p><p style="font-size:12px;margin:4px 0 0"><b class="num">${nTem}/${MASCATE.length}</b> itens · catálogo inteiro ${rlV(MASCATE_TOTAL,13)}</p></div></div>
   <div class="rl-wrap" style="margin-top:10px">${cats}</div></section>`;
}
function mascateLigar(el){return !!el;}
function usando(x){const U=s.cosm.usa;if(x.cat==='emote')return U.emotes.includes(x.id);if(x.cat==='tabuleiro')return U.tabuleiro[x.arena]===x.id;const sl=(MASCATE_CATS.find(c=>c.k===x.cat)||{slot:x.cat}).slot;return U[sl]===x.id;}
function itemHTML(x,barato){
  const tem=temCosm(x.id),usa=tem&&usando(x);
  let acao;
  if(!tem)acao=`<button class="btn gold small" data-rl="mascate" data-id="${x.id}" aria-label="Comprar ${escH(x.nome)} por ${x.preco} Vinténs">${rlV(x.preco,14)}</button>${barato&&s.grao<x.preco&&x.preco-s.grao<=300?`<span class="rl-falta">faltam ${fmt(x.preco-s.grao)}</span>`:''}`;
  else acao=`<button class="btn small ${usa?'':'gold'}" data-rl="equipar" data-id="${x.id}">${x.cat==='emote'?(usa?'Na roda ✓':'Pôr na roda'):usa?'Usando ✓':'Usar'}</button>`;
  const sub=x.cat==='tabuleiro'?'Arena '+x.arena:x.fonte&&!x.preco?'de '+x.fonte:x.d||(x.reino?folhNome(x.reino):'');
  return `<div class="rl-item ${usa?'usa':''}"><span class="rl-prev">${previewSVG(x)}</span><b>${escH(x.nome)}</b>${sub?`<small>${escH(sub)}</small>`:''}${acao}</div>`;
}
function previewSVG(x){
  const c=x.cor||'#B08A5A';
  if(x.cat==='emote')return `<span class="rl-bub">${escH(x.nome)}</span>`;
  if(x.cat==='moldura')return `<svg viewBox="0 0 88 64"><rect x="26" y="4" width="36" height="56" rx="5" fill="#211A13" stroke="${x.reino?rlCorReino(x.reino):c}" stroke-width="5"/>${x.premium?'<path d="M44 14c3 5 7 7 7 12a7 7 0 0 1-14 0c0-4 4-7 7-12z" fill="#FFB23D"/>':'<rect x="33" y="12" width="22" height="18" rx="2" fill="#3a2e22"/>'}${x.id.startsWith('mold-cordel')?'<path d="M29 9h30M29 55h30" stroke="#E9DDC2" stroke-dasharray="3 2" stroke-width="2"/>':''}</svg>`;
  if(x.cat==='verso')return `<svg viewBox="0 0 88 64"><defs><pattern id="pv-${x.id}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${c}"/><circle cx="4" cy="4" r="1.6" fill="#ffffff55"/></pattern></defs><rect x="26" y="4" width="36" height="56" rx="5" fill="url(#pv-${x.id})" stroke="#20140A" stroke-width="2"/><circle cx="44" cy="32" r="8" fill="none" stroke="#20140A" stroke-width="2"/></svg>`;
  if(x.cat==='tabuleiro')return `<svg viewBox="0 0 88 64"><rect x="4" y="8" width="80" height="48" rx="6" fill="${c}" opacity=".35"/>${[0,1,2,3].map(i=>`<rect x="${9+i*19}" y="18" width="15" height="28" rx="3" fill="${c}" opacity=".85"/>`).join('')}<text x="44" y="60" text-anchor="middle" font-size="8" fill="#F3E7CD">A${x.arena}</text></svg>`;
  if(x.cat==='heroi')return `<svg viewBox="0 0 88 64"><circle cx="44" cy="22" r="11" fill="#c99a6b"/><path d="M24 62c2-16 10-22 20-22s18 6 20 22z" fill="${c}"/><path d="M31 16q13-12 26 0z" fill="#3a2414"/></svg>`;
  if(x.cat==='rastro')return `<svg viewBox="0 0 88 64">${[0,1,2,3,4,5].map(i=>`<circle cx="${12+i*13}" cy="${48-i*6}" r="${2+i*0.9}" fill="${c}" opacity="${0.35+i*0.12}"/>`).join('')}<path d="M76 10l3 6 6 1-5 4 2 6-6-3-6 3 2-6-5-4 6-1z" fill="#FFE38A"/></svg>`;
  return '';
}
function carroSVG(){return `<svg viewBox="0 0 120 70" width="110" height="64" aria-hidden="true"><ellipse cx="60" cy="64" rx="56" ry="5" fill="#0006"/><path d="M8 30q10-14 20 0" stroke="#C9A35A" stroke-width="2" fill="none"/><rect x="34" y="22" width="70" height="26" rx="3" fill="#8E5F38"/><path d="M34 22l8-12h54l8 12z" fill="#C4632B"/><path d="M40 14h52" stroke="#E9DDC2" stroke-width="1.5" stroke-dasharray="4 3"/>${['#E8862E','#3FA34D','#2E9FB5','#7B5BD6','#B08A5A'].map((c,i)=>`<path d="M${44+i*12} 22v8l-3 4h6l-3-4" stroke="#20140A" stroke-width="1" fill="${c}"/>`).join('')}<circle cx="50" cy="52" r="10" fill="none" stroke="#C9A35A" stroke-width="3"/><circle cx="90" cy="52" r="10" fill="none" stroke="#C9A35A" stroke-width="3"/><path d="M16 46l18-6" stroke="#6B4427" stroke-width="3"/><path d="M6 44q4-12 12-10l2 10-4 10h-4z" fill="#6b5a4a"/><circle cx="10" cy="40" r="1.4" fill="#F3E7CD"/></svg>`;}

/* ===================== GANCHOS PEQUENOS ===================== */
function trocaMissaoHTML(i){
  if(typeof podeTrocaVila!=='function'||!podeTrocaVila())return '';
  const m=s.missoes&&s.missoes.lista[i];if(!m||m.pego)return '';
  return `<button class="ibtn" data-rl="trocaM" data-i="${i}" title="Troca da Fogueira (o prêmio não muda)" aria-label="Trocar esta missão (Fogueira; o prêmio não muda)">${rlIc('troca',16)}</button>`;
}
function vigiaHTML(){
  if(!temOlhoDoVigia())return '';
  const t=proximoTesouro();
  return `<div class="rl-vig" role="note">${typeof chestImg==='function'?chestImg(t,26):''}<span><b>Olho do Vigia:</b> a próxima vitória traz ${escH(BAUS[t].nome)}<small>ou, com sorte, uma ${escH(BAUS.lendario.nome)}</small></span></div>`;
}
function decksSalvosHTML(){
  const mx=decksMax();const D=s.decks||[];
  return `<section class="panel"><div class="ph"><h3>Decks salvos</h3><span class="muted num" style="font-size:12px">${mx}/3</span></div><div class="rl-decks">${[0,1,2].map(k=>{
    if(k>=mx)return `<div class="rl-dk trav"><span><b>Espaço ${k+1}</b><small>abre com a Fogueira Nv ${k===1?2:4}</small></span><span></span><span></span></div>`;
    const d=D[k];return `<div class="rl-dk"><span><b>${escH(d?d.nome:'Espaço '+(k+1))}</b><small>${d?d.cartas.length+' cartas · '+d.terrenos.map(t=>folhNome(t)).join(', '):'vazio'}</small></span><button class="btn small" data-rl="salvarDeck" data-i="${k}">Salvar aqui</button><button class="btn gold small" data-rl="usarDeck" data-i="${k}" ${d?'':'disabled'}>Usar</button></div>`;}).join('')}</div></section>`;
}
function revancheHTML(out){
  if(!temCaderno()||!out)return '';
  const modo=out.modo||'arena';if(modo!=='arena'&&modo!=='treino')return '';if(out.novaArena)return '';
  return `<button class="btn md" data-rl="revanche">Revanche</button>`;
}

/* ---------- roda de emotes (retrato do herói na batalha) ---------- */
let rlEmoT=0;
const RL_RESP=['Oxente, que coragem!','Vamos ver na próxima rodada.','Hum... boa jogada.','Aqui ninguém se assusta à toa.','Égua! Essa foi boa.','Calma, que a noite é longa.'];
function emoteRoda(el){
  $$('.rl-emo').forEach(x=>x.remove());
  const r=(el&&el.getBoundingClientRect)?el.getBoundingClientRect():{left:20,top:200,bottom:240,width:40};
  const box=document.createElement('div');box.className='rl-emo';box.setAttribute('role','menu');box.setAttribute('aria-label','Emotes');
  const L=emotesDaRoda();
  if(s.cosm.emoteMudo)box.innerHTML=`<p>Emotes silenciados.</p><button class="btn small" data-rl="emoteLiga">Ligar emotes</button>`;
  else if(!L.length)box.innerHTML=`<p>Sem emotes ainda. A Fogueira Nv 1 dá "Eita!" e o Mascate vende mais.</p>`;
  else box.innerHTML=L.map(x=>`<button class="btn small" role="menuitem" data-rl="emote" data-id="${x.id}" ${Date.now()<rlEmoT?'disabled':''}>${escH(x.nome)}</button>`).join('')+(Date.now()<rlEmoT?'<p class="muted">Espera um pouquinho...</p>':'');
  document.body.appendChild(box);
  const bw=box.offsetWidth,bh=box.offsetHeight;
  let x=clamp(r.left+(r.width||0)/2-bw/2,8,window.innerWidth-bw-8),y=r.top-bh-8;if(y<8)y=Math.min(window.innerHeight-bh-8,(r.bottom||r.top)+8);
  box.style.left=x+'px';box.style.top=y+'px';
  const fora=e=>{if(!box.contains(e.target)){box.remove();document.removeEventListener('pointerdown',fora,true);}};
  setTimeout(()=>document.addEventListener('pointerdown',fora,true),0);
  const f=$('button:not([disabled])',box);if(f)try{f.focus({preventScroll:true});}catch(e){}
  box.addEventListener('keydown',e=>{if(e.key==='Escape'){box.remove();if(el&&el.focus)el.focus();}});
  box._ancora=r;return box;
}
function rlFala(r,txt,quem){
  const b=document.createElement('div');b.className='rl-fala';b.innerHTML=`<span class="rl-bub">${quem?`<small style="display:block;font-weight:700;font-size:10.5px;opacity:.75">${escH(quem)}</small>`:''}${escH(txt)}</span>`;
  document.body.appendChild(b);const w=b.offsetWidth,h=b.offsetHeight;
  b.style.left=clamp(r.left+(r.width||0)/2-20,8,window.innerWidth-w-8)+'px';b.style.top=Math.max(8,r.top-h-6)+'px';
  if(!RM&&b.animate)b.animate([{transform:'translateY(8px) scale(.8)',opacity:0},{transform:'none',opacity:1}],{duration:220,easing:'ease-out'});
  setTimeout(()=>b.remove(),2200);
}
function soltarEmote(id,box){
  const x=COSM[id];if(!x)return;const r=box&&box._ancora||{left:40,top:300,width:40};if(box)box.remove();
  rlEmoT=Date.now()+8000;sfxR('emote','tap');rlFala(r,x.nome);
  // às vezes o rival responde (sorte só de interface: Math.random, nunca o rnd das partidas)
  if(typeof B!=='undefined'&&B&&RIVAIS[B.rival]&&Math.random()<0.35){
    const R=RIVAIS[B.rival];const q=$('#hR')||$('#battle [data-rival]')||null;const rr=q?q.getBoundingClientRect():{left:window.innerWidth-120,top:90,width:60};
    const linhas=RL_RESP.concat(R.jeito?[R.jeito]:[]);
    setTimeout(()=>rlFala(rr,linhas[Math.floor(Math.random()*linhas.length)],R.curto||R.nome),900);
  }
}

/* ===================== ECONOMIA v10 ===================== */
const RL_PAL=['#3987e5','#d95926','#199e70','#c98500','#d55181','#008300','#9085e9','#e66767']; // validado no escuro (#2A2219)
function rlStack(itens,aria){
  const t=itens.reduce((a,x)=>a+x.v,0)||1;
  return `<div class="rl-stk" role="img" aria-label="${escH(aria)}">${itens.filter(x=>x.v>0).map(x=>`<i style="width:${(x.v/t*100).toFixed(2)}%;background:${x.c}" data-tt="${escH(x.n)}: ${fmt(x.v)}"></i>`).join('')}</div>
   <div class="rl-leg">${itens.map(x=>`<span><i style="background:${x.c}"></i>${escH(x.n)}${x.novo?' <em class="rl-chip novo">novo</em>':''}<b>${fmt(x.v)}</b></span>`).join('')}</div>`;
}
function renderEconomiaV10(m){
  const E=s.eco,t=ecoTotais(),Q=E.queimado,Rl=E.ralos||{};
  const D7=ecoUltimosDias(7),hj=D7[6];
  const S7=(k,f)=>D7.reduce((a,d)=>a+((d[k]||{})[f]||0),0);
  const c7=D7.reduce((a,d)=>a+d.tc,0),q7=D7.reduce((a,d)=>a+d.tq,0),n7=c7-q7;
  const eq=hj.tc>0&&Math.abs(hj.net)<=hj.tc*0.10;
  const mxH=Math.max(1,hj.tc,hj.tq);
  // termômetro: queimado/criado (7 dias; sem dados, o total)
  const ratio=c7?q7/c7:(t.c?t.qv/t.c:0);const pos=clamp(ratio/1.5,0,1)*100;
  const lbl=ratio>1.10?'Moeda ficando rara':ratio>=0.85?'Em equilíbrio':ratio>=0.5?'Aquecida':'Sobrando moeda';
  // barras do saldo por dia (dourado = sobrou, violeta = gastou mais que ganhou: nada de vermelho)
  const mxN=Math.max(1,...D7.map(d=>Math.abs(d.net)));const W=280,H=90,bw=W/7;
  const spark=`<svg class="rl-spark" viewBox="0 0 ${W} ${H+16}" role="img" aria-label="Saldo por dia nos últimos 7 dias">
   <line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="#4D3D2A" stroke-width="1"/>
   ${D7.map((d,i)=>{const h=Math.abs(d.net)/mxN*(H/2-6);const x=i*bw+bw*0.22,w=bw*0.56;const y=d.net>=0?H/2-h:H/2;
     return `<g data-tt="${d.d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit'})}: criado ${fmt(d.tc)}, queimado ${fmt(d.tq)}, saldo ${d.net>0?'+':''}${fmt(d.net)}"><rect x="${i*bw}" y="0" width="${bw}" height="${H+16}" fill="transparent"/><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1.5,h).toFixed(1)}" rx="3" fill="${d.net>=0?'#F2BE4A':'#9085e9'}"/><text x="${(i*bw+bw/2).toFixed(1)}" y="${H+13}" text-anchor="middle" font-size="10" fill="#C1AB89">${d.d.toLocaleDateString('pt-BR',{weekday:'narrow'})}</text></g>`;}).join('')}</svg>`;
  const term=`<svg viewBox="0 0 300 44" class="rl-spark" role="img" aria-label="Termômetro: ${lbl}, ${Math.round(ratio*100)}% do que entrou foi queimado">
   <rect x="0" y="12" width="300" height="12" rx="6" fill="#211A13"/>
   <rect x="${(0.85/1.5*300).toFixed(1)}" y="12" width="${((1.10-0.85)/1.5*300).toFixed(1)}" height="12" fill="#5DBB63" opacity=".55"/>
   <text x="${(0.975/1.5*300).toFixed(1)}" y="40" text-anchor="middle" font-size="10" fill="#BFF0BF">alvo 85–110%</text>
   <rect x="${(pos*3-2).toFixed(1)}" y="6" width="4" height="24" rx="2" fill="#F3E7CD"/>
   <text x="2" y="9" font-size="9" fill="#C1AB89">0%</text><text x="298" y="9" font-size="9" text-anchor="end" fill="#C1AB89">150%</text></svg>`;
  const novo=s.v10em&&Date.now()-s.v10em<7*864e5;
  const fontes=[['vitorias','Vitórias'],['baus','Tesouros'],['missoes','Missões'],['trilha','Trilha'],['inicial','Inicial']].map(([k,n],i)=>({n,v:S7('c',k),c:RL_PAL[i]}));
  const ralos=[{n:'Pacotes',v:S7('q','pacotes')},{n:'Melhorias',v:S7('q','melhorias')},{n:'Pressa + taxas da Feira',v:S7('q','pressa')+S7('q','taxasVoce')},{n:'Peleja',v:S7('q','torneio')},
    {n:'Ascensão',v:S7('q','ascensao'),novo},{n:'Vila',v:S7('q','vila'),novo},{n:'Causos',v:S7('q','causos'),novo},{n:'Mascate',v:S7('q','mascate'),novo}].map((x,i)=>Object.assign(x,{c:RL_PAL[i]}));
  const passos=proximosPassos();
  const parado=s.grao>=1500?(()=>{const n=VILA_ORDEM.filter(p=>podeVila(p).ok).length;return n?`<p class="muted" style="font-size:13px;margin:6px 0 0">Seus Vinténs parados: <b class="num">${fmt(s.grao)}</b> · a Vila tem ${n} ${n>1?'níveis':'nível'} ao seu alcance.</p>`:'';})():'';
  const C=E.cartas;
  const pg7=D7.reduce((a,d)=>a+d.pg,0),pq7=D7.reduce((a,d)=>a+d.pq,0);
  const tipoNome={ascensao:'Ascensão',vila:'Vila',causos:'Causos',mascate:'Mascate'};
  m.innerHTML=`<div class="rl-wrap rl-eco">
   <section class="panel"><div class="rl-h"><div><h2 class="rl-rye">Economia</h2><p class="muted">Toda moeda que entra precisa de um ralo. Quando o ralo acompanha a torneira, o Vintém vale alguma coisa.</p></div></div></section>
   <div class="tiles2">
    <section class="panel"><h3 style="font-size:13px" class="muted">Carteira · ${escH(MOEDA_PL())}</h3><div class="rl-big">${rlIc('vintem',26)} ${fmt(s.grao)}</div>${parado}</section>
    <section class="panel"><h3 style="font-size:13px" class="muted">Carteira · ${escH(PO_NOME(2))}</h3><div class="rl-big">${rlIc('brasa',26)} ${fmt(s.po)}</div></section>
   </div>
   <div class="rl-two"><div class="rl-wrap">
    <section class="panel"><div class="ph"><h3>Hoje</h3>${eq?'<span class="rl-chip ok">✓ Em equilíbrio</span>':''}</div>
     <div class="rl-bars"><div class="rl-bar"><span>Criado</span><span class="tr"><i style="width:${hj.tc/mxH*100}%;background:#F2BE4A"></i></span><b class="num">${fmt(hj.tc)}</b></div>
     <div class="rl-bar"><span>Queimado</span><span class="tr"><i style="width:${hj.tq/mxH*100}%;background:#9085e9"></i></span><b class="num">${fmt(hj.tq)}</b></div></div>
     <p style="font-size:13px;margin:8px 0 0">Saldo de hoje: <b class="num">${hj.net>0?'+':''}${fmt(hj.net)}</b> ${escH(MOEDA_PL())}</p></section>
    <section class="panel"><div class="ph"><h3>Últimos 7 dias</h3><span class="muted" style="font-size:12px">${n7>0?'+':''}${fmt(n7)} de saldo</span></div>${spark}
     <div class="rl-leg" style="margin-top:4px"><span><i style="background:#F2BE4A"></i>sobrou no dia</span><span><i style="background:#9085e9"></i>gastou mais que ganhou</span></div>
     <div class="rl-leg"><span>Criado<b>${fmt(c7)}</b></span><span>Queimado<b>${fmt(q7)}</b></span><span>Saldo<b>${n7>0?'+':''}${fmt(n7)}</b></span></div>
     <h4 style="margin:12px 0 2px;font-size:13px">Termômetro: <span style="color:var(--gold)">${lbl}</span> <span class="muted num">(${Math.round(ratio*100)}%)</span></h4>${term}</section>
    <section class="panel"><div class="ph"><h3>Criado por fonte · 7 dias</h3></div>${rlStack(fontes,'Criado por fonte')}</section>
    <section class="panel"><div class="ph"><h3>Queimado por ralo · 7 dias</h3></div>${rlStack(ralos,'Queimado por ralo')}</section>
   </div><div class="rl-wrap">
    <section class="panel"><div class="ph"><h3>Seus próximos passos</h3></div><div class="rl-passos">${passos.map(p=>`<button class="rl-passo" data-rl="passo" data-t="${p.tipo}" data-id="${p.id}"><small>${tipoNome[p.tipo]}</small><b>${escH(p.nome)}</b><span>${rlV(p.custo,14)}${p.po?' + '+rlB(p.po,13):''} · ${p.falta?`<span class="rl-falta">faltam ${fmt(p.falta)}</span>`:'<span class="okmsg">dá agora!</span>'}</span></button>`).join('')||'<p class="muted">Tudo feito! Que assombro.</p>'}</div></section>
    <section class="panel"><div class="ph"><h3>Em circulação</h3></div><div class="rl-leg" style="margin:0"><span>Com você<b>${fmt(s.grao)}</b></span><span>Com os feirantes<b>${fmt(s.mercado.poolRobos)}</b></span><span>Total<b>${fmt(t.circ)}</b></span></div>
     <p class="muted" style="font-size:12px;margin:8px 0 0">Conta que sempre fecha: criado ${fmt(t.c)} + reserva dos feirantes ${fmt(E.reservaRobos)} − queimado ${fmt(t.q)} = ${fmt(t.c+E.reservaRobos-t.q)} ${ecoInvariante()?'<span class="okmsg">✓</span>':''}</p>
     ${Q.taxasRobos?`<p class="muted" style="font-size:11.5px;margin:4px 0 0">Taxas antigas entre feirantes: ${fmt(Q.taxasRobos)}. Negócios entre feirantes não criam nem queimam moeda.</p>`:''}
     <div class="rl-leg"><span>Queimado no total<b>${fmt(t.qv)}</b></span><span>Ralos novos<b>${fmt(sum(Rl))}</b></span></div></section>
    <section class="panel"><div class="ph"><h3>${escH(PO_NOME(2))} · 7 dias</h3></div><div class="rl-leg" style="margin:0"><span>Ganhas<b>${fmt(pg7)}</b></span><span>Gastas<b>${fmt(pq7)}</b></span><span>No total<b>${fmt(E.poGanho)} / ${fmt(E.poGasto)}</b></span></div><p class="muted" style="font-size:11.5px;margin:6px 0 0">Brasa não se vende e nunca vira Vintém.</p></section>
    <section class="panel"><div class="ph"><h3>Cartas</h3></div><div class="tiles2" style="gap:14px"><div><b style="font-size:13px">Entraram</b><div class="rl-leg" style="grid-template-columns:1fr;margin-top:4px">
     <span>presente<b>${fmt(C.presente)}</b></span><span>pacotes<b>${fmt(C.pacotes)}</b></span><span>tesouros<b>${fmt(C.baus)}</b></span><span>criação<b>${fmt(C.criacao)}</b></span><span>compradas<b>${fmt(C.compradas)}</b></span></div></div>
     <div><b style="font-size:13px">Saíram</b><div class="rl-leg" style="grid-template-columns:1fr;margin-top:4px"><span>queimadas<b>${fmt(C.queimadas)}</b></span><span>melhorias<b>${fmt(C.melhoria)}</b></span><span>ascensão<b>${fmt(C.ascensao||0)}</b></span><span>vendidas<b>${fmt(C.vendidas)}</b></span></div></div></div>
     <p class="muted" style="font-size:12px;margin:6px 0 0">Ascensões: <b class="num">${totalAscensoes()}</b></p></section>
   </div></div>
   <p class="muted" style="font-size:12px;text-align:center">Moeda simulada · sem dinheiro real. Nada aqui pode ser comprado com dinheiro.</p>
  </div>`;
}
/* dica flutuante dos gráficos ([data-tt]): passa o mouse ou toca */
(function(){
  if(typeof document==='undefined')return;let tt=null;
  const hide=()=>{if(tt){tt.remove();tt=null;}};
  const show=(el,x,y)=>{if(!tt){tt=document.createElement('div');tt.className='rl-ttip';document.body.appendChild(tt);}tt.textContent=el.dataset.tt;const w=tt.offsetWidth;tt.style.left=clamp(x-w/2,6,window.innerWidth-w-6)+'px';tt.style.top=Math.max(6,y-40)+'px';};
  document.addEventListener('pointermove',e=>{const el=e.target.closest&&e.target.closest('[data-tt]');if(el)show(el,e.clientX,e.clientY);else hide();},{passive:true});
  document.addEventListener('pointerdown',e=>{const el=e.target.closest&&e.target.closest('[data-tt]');if(el)show(el,e.clientX,e.clientY);},{passive:true});
  window.addEventListener('scroll',hide,{passive:true});
})();

/* ===================== CLIQUES ===================== */
async function rlAcao(a){
  const act=a.dataset.rl,id=a.dataset.id;
  if(act==='predio'){sfxR('tap');abrirPredio(a.dataset.p);return;}
  if(act==='subir'){const p=a.dataset.p;const c=custoVila(p);
    const ok=await perguntar(`Subir <b>${escH(VILA_PREDIOS[p].nome)}</b> para o Nv ${nivelVila(p)+1} por <b>${fmt(c)} ${escH(MOEDA_CAPS())}</b>? Os Vinténs vão para a fogueira.`,'Construir');if(!ok)return;
    const r=subirVila(p);if(!r.ok){sfxR('erro');toast(escH(r.motivo));return;}
    sfxR('construir','forja');setTimeout(()=>sfxR('moedaFogo','coin'),200);rlCarimbo('Nível '+r.nivel+'!');toast(`${escH(VILA_PREDIOS[p].nome)} Nv ${r.nivel}: ${escH(r.premio.t)}`,{ms:3600});rlRedesenhar();return;}
  if(act==='folheto'){sfxR('pagina','abrir');abrirFolheto(a.dataset.r);return;}
  if(act==='pagina'){sfxR('pagina','tap');abrirPagina(id);return;}
  if(act==='lercauso'){const r=lerCauso(id);if(!r.ok){sfxR('erro');toast(escH(r.motivo));return;}
    sfxR('pagina','abrir');setTimeout(()=>sfxR('moedaFogo','coin'),150);
    const top=[...RL_FOLHAS].pop();if(top)fecharOv(top,true);
    rlRedesenhar();abrirPagina(id);
    if(r.folheto){rlCarimbo('Folheto completo!');toast(`Folheto ${escH(folhNome(r.folheto))} completo: Moldura de Cordel e título "Cordelista ${escH(REINO_DE[r.folheto])}"!`,{ms:4200});}
    if(r.todos)setTimeout(()=>toast('Os 5 folhetos! Visual "Contador de Causos" e verso "Xilogravura".',{ms:4800}),1200);
    return;}
  if(act==='ascender'){const k=custoAscensao(id);if(!k)return;const N=ASC_NOME()[k.tier-1];
    const ok=await perguntar(`Ascender <b>${escH(CARD[id].nome)}</b> para <b>${escH(N)}</b> por <b>${fmt(k.grao)} ${escH(MOEDA_CAPS())}</b>${k.usa?` + ${k.usa} ${k.usa>1?'cópias':'cópia'}`:''}${k.po?` + ${fmt(k.po)} ${escH(PO_NOME(2))}`:''}? É só visual: ATK e vida não mudam.`,'Ascender');if(!ok)return;
    const r=fazerAscensao(id);if(!r.ok){sfxR('erro');toast(escH(r.motivo));return;}
    sfxR('ascensao','levelup');rlCarimbo(ASC_GLIFO()[r.tier-1]+' '+N+'!');rlRedesenhar();return;}
  if(act==='mascate'){const x=COSM[id];const ok=await perguntar(`Comprar <b>${escH(x.nome)}</b> por <b>${fmt(x.preco)} ${escH(MOEDA_CAPS())}</b>? É seu para sempre (não vai para a Feira). Os Vinténs vão para a fogueira.`,'Comprar');if(!ok)return;
    const r=comprarMascate(id);if(!r.ok){sfxR('erro');toast(escH(r.motivo));return;}
    sfxR('moedaFogo','coin');toast(`${escH(x.nome)} é seu!`);rlRedesenhar();return;}
  if(act==='equipar'){const x=COSM[id];const sl=x.cat==='emote'?'emotes':(MASCATE_CATS.find(c=>c.k===x.cat)||{slot:x.cat}).slot;
    const r=(x.cat!=='emote'&&usando(x))?equipar(sl,null,x.arena):equipar(sl,id);if(!r.ok){toast(escH(r.motivo));return;}sfxR('tap');rlRedesenhar();return;}
  if(act==='trocaM'){if(trocarMissao(+a.dataset.i)){sfxR('tap');toast('Missão trocada pela Fogueira. O prêmio continua o mesmo.');}rlRedesenhar();return;}
  if(act==='salvarDeck'){const k=+a.dataset.i;const r=salvarDeck(k,'Deck '+(k+1));toast(r.ok?'Deck salvo no espaço '+(k+1)+'.':escH(r.motivo));rlRedesenhar();return;}
  if(act==='usarDeck'){const r=carregarDeck(+a.dataset.i);if(!r.ok){toast(escH(r.motivo));return;}sfxR('tap');toast('Deck trocado.',{desfazer:()=>{s.deck.cartas=r.antes.cartas;s.deck.terrenos=r.antes.terrenos;save();refresh();}});rlRedesenhar();return;}
  if(act==='vigiar'){const sel=$('#rlVigSel');if(!sel||!sel.value)return;const r=vigiar(sel.value);if(!r.ok)toast(escH(r.motivo));rlRedesenhar();return;}
  if(act==='desvigiar'){desvigiar(id);rlRedesenhar();return;}
  if(act==='emote'){soltarEmote(id,a.closest('.rl-emo'));return;}
  if(act==='emoteLiga'){s.cosm.emoteMudo=false;save();const b=a.closest('.rl-emo');const r=b&&b._ancora;if(b)b.remove();emoteRoda({getBoundingClientRect:()=>r});return;}
  if(act==='revanche'){const el=a.closest('.result');const o=Object.assign({},(typeof BU!=='undefined'&&BU.ultimo)||{modo:'arena'});if(el)el.remove();if(typeof fecharBatalha==='function')fecharBatalha();UI.tab='inicio';refresh();if(deckOk())iniciarPartida(o);return;}
  if(act==='passo'){const t=a.dataset.t;
    if(t==='ascensao'){UI.tab='cartas';refresh();abrirDetalhe(id);}
    else if(t==='vila'){go('vila');abrirPredio(id);}
    else if(t==='causos'){go('vila');abrirFolheto(CARD[id].terreno);}
    else if(t==='mascate'){go('loja');setTimeout(()=>{const e=$('#mascate');if(e)e.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});},60);}
    return;}
}
if(typeof document!=='undefined'){
  document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-rl]');if(!a||a.disabled)return;e.preventDefault();rlAcao(a);});
  document.addEventListener('change',e=>{
    const t=e.target;
    if(t.dataset&&t.dataset.rlSel){const r=equipar(t.dataset.rlSel,t.value||null);if(!r.ok)toast(escH(r.motivo));sfxR('tap');return;}
    if(t.dataset&&t.dataset.rlChk==='emoteMudo'){s.cosm.emoteMudo=t.checked;save();return;}
    if(t.dataset&&t.dataset.rlChk==='ascOff'){alternarFormaBasica(t.dataset.id);sfxR('tap');return;}
  });
}

