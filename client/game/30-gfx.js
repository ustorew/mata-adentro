/* ===================== GRÁFICOS: ícones, arte, cenas, cartas ===================== */
let RM=false;
try{const mq=matchMedia('(prefers-reduced-motion: reduce)');RM=mq.matches;mq.addEventListener&&mq.addEventListener('change',e=>{RM=e.matches;});}catch(e){}

/* ---------- ícones em pixel (desenhados em código) ---------- */
const ICOL={k:'#1A1420',w:'#FFFFFF',y:'#F2C230',Y:'#FFE58A',o:'#B9801C',b:'#4FB3E8',B:'#1F6FA8',c:'#BFE6FA',
 p:'#B36BE8',P:'#6E3FA8',l:'#E6CCFF',r:'#E8693A',R:'#A8341C',f:'#F2C230',e:'#E0565B',E:'#9A2A35',
 g:'#5DBB63',G:'#2F6E2A',m:'#9BD34B',s:'#C9CFC9',S:'#7D8A8C',n:'#A0673A',N:'#6B4630',t:'#D9A066',
 q:'#3BA39A',Q:'#1F4E5A',v:'currentColor',a:'#B8B2A6',A:'#7A746A',x:'#F3E7CD'};
const ICONS={
 coin:['..kkkkkk..','.kYYyyyyk.','kYYyyoyyok','kYyyoyoyok','kyyyyoyyok','kyyyoyoyok','kyyyyoyyok','kyyyyoyyok','.kooyyyok.','..kkkkkk..'],
 po:['....kk....','...kplk...','...kppk...','kkkkppkkkk','kllpppppPk','.kPpppppk.','..kpppPk..','.kppkkpPk.','.kPk..kPk.','.kk....kk.'],
 trofeu:['kkkkkkkkkk','kYyyyyyyok','kYyyyyyyok','.kYyyyyok.','.kyyyyyok.','..kyyyok..','...kyok...','...kyok...','..kyyyok..','.kkkkkkkk.'],
 energia:['...kk...','..kcck..','.kcbbBk.','kcbbbbBk','kbbbbbBk','kbbbbbBk','.kbbbBk.','..kbBk..','...kk...'],
 espada:['......kkk','.....kwsk','....kwsk.','...kwsk..','k.kwsk...','kkwsk....','.kNk.....','kNkk.....','kk.......'],
 coracao:['.kk...kk.','kwek.keek','keeekeeek','keeeeeeEk','.keeeeEk.','..keeEk..','...kEk...','....k....'],
 furia:['...k....','..krk.k.','..krrkrk','.krfrrrk','.krffrrk','krffYfrk','krfYYfrk','.kkkkkk.'],
 voar:['......kkk','....kkwwk','..kkwwwsk','.kwwwwssk','kwwwwssk.','kwwwssk..','.kssskk..','..kkk....'],
 espinhos:['...kk...','...kmk..','..kmgk..','..kmgk..','.kmggGk.','.kmggGk.','kmgggGGk','kkkkkkkk'],
 brotar:['kk....kk','kmk..kmk','kmmkkmgk','.kmmkgk.','..kkGk..','...kGk..','.knnnnk.','.kNNNNk.'],
 pisotear:['.kk..kk.','ksk..ksk','ksk..ksk','ksSkkSsk','ksSSSSsk','.ksSSsk.','..kkkk..'],
 ataqueDuplo:['.....k.k','....krkr','...krkr.','..krkr..','.krkr...','krkr....','kk......'],
 bloqueiaVoo:['kkkkkkkk','kssssSSk','kswssSSk','kssssSSk','.kssSSk.','.kssSSk.','..ksSk..','...kk...'],
 habilidade:['.kkkkkk.','ktxxxxtk','.kxkkxk.','.kxxxxk.','.kxkkxk.','.kxxxxk.','ktxxxxtk','.kkkkkk.'],
 milharal:['...kk...','..kYyk..','..kyok..','.gkyykg.','gGkyokGg','.gGkkGg.','..gGGg..','...gg...'],
 pomar:['....gk..','...kgk..','.kkkkkk.','kewEeeEk','keeeeeEk','keeeeeEk','.keeeEk.','..kkkk..'],
 brejo:['...k....','..kqk...','.kqcqk..','.kqqqk..','kqqqqQk.','kqqqqQk.','.kqqQk..','..kkk...'],
 pasto:['........','.g...g..','.gg.gg.g','..gggg.g','g.gGgggg','ggGGgGgg','gGGGGGGg','kkkkkkkk'],
 neutro:['...kk...','..knnk..','.knnnnk.','knnnnnnk','kNnkknNk','kNnkknNk','kNnkknNk','kkkkkkkk'],
 g_comum:['..kkkk..','.kaaaak.','kawaaaAk','kaaaaaAk','kaaaaaAk','kaaaaAAk','.kAAAAk.','..kkkk..'],
 g_incomum:['...kk...','..kgGk..','.kwggGk.','kgggggGk','kgggggGk','.kggGGk.','..kGGk..','...kk...'],
 g_rara:['.kkkkkk.','kcwbbbBk','kbbbbbBk','.kbbbBk.','..kbBk..','...kk...'],
 g_epica:['...kk...','..kplk..','.kkplkk.','kpppplPk','kPpppPPk','.kkpPkk.','..kpPk..','...kk...'],
 g_lendaria:['k...k...k','ky.kyk.yk','kyykYkyyk','kyyyYyyyk','kyyyyyyok','koooooook','kkkkkkkkk'],
 inicio:['....vv....','...vvvv...','..vvvvvv..','.vvvvvvvv.','vvvvvvvvvv','.vvv..vvv.','.vvv..vvv.','.vvv..vvv.','.vvvvvvvv.'],
 cartas:['...vvvvvv.','...v....v.','vvvvvv..v.','v....v..v.','v.vv.v..v.','v....v..v.','v.vv.vvvv.','v....v....','vvvvvv....'],
 loja:['...vvvv...','..v....v..','..v....v..','vvvvvvvvvv','vvvvvvvvvv','vvv.vv.vvv','vvvvvvvvvv','vvvvvvvvvv','.vvvvvvvv.'],
 mercado:['vvvvvvvvvv','v.v.v.v.vv','vvvvvvvvvv','.v......v.','.v......v.','.vvvvvvvv.','.v.vv.vv.v','.vvvvvvvv.'],
 economia:['........vv','........vv','.....vv.vv','.....vv.vv','..vv.vv.vv','..vv.vv.vv','..vv.vv.vv','vvvvvvvvvv'],
 som:['....v.....','...vv...v.','vvvvv..v..','vvvvv.v..v','vvvvv.v..v','vvvvv..v..','...vv...v.','....v.....'],
 mudo:['....v.....','...vv.....','vvvvv.v..v','vvvvv..vv.','vvvvv..vv.','vvvvv.v..v','...vv.....','....v.....'],
 musica:['...vvvvvvv','...vvvvvvv','...v.....v','...v.....v','...v.....v','.vvv...vvv','vvvv..vvvv','.vv....vv.'],
 semmusica:['...vv.....','...vvv....','...v.vv...','...v...v..','...v..v..v','.vvv...vv.','vvvv...vv.','.vv...v..v'],
 bandeira:['vv........','vvwwwwww..','vvwwwwwww.','vvwwwwww..','vvwwwwwww.','vv........','vv........','vv........','vv........'],
 mao:['...kk.......','..kwwk......','..kwwk......','..kwwkkk....','..kwwkwwkk..','kkkwwkwwkwk.','kwkwwwwwwwwk','kwwwwwwwwwwk','.kwwwwwwwwwk','..kwwwwwwwk.','...kwwwwwk..','...kkkkkkk..'],
 cadeado:['..kkkk..','.kSkkSk.','.kk..kk.','kkkkkkkk','kyyyyyok','kyykkyok','kyyyyyok','kkkkkkkk']
};
const _icCache={};
function ic(name,px,cls){
  const key=name+'|'+px+'|'+(cls||'');if(_icCache[key])return _icCache[key];
  if(VICONS[name]){const o=`<svg class="px vi ${cls||''}" viewBox="1.5 1.5 21 21" width="${px}" height="${px}" aria-hidden="true" focusable="false">${VICONS[name]}</svg>`;_icCache[key]=o;return o;}
  const rows=ICONS[name]||ICONS.habilidade;const h=rows.length,w=Math.max(...rows.map(r=>r.length));
  let r='';
  for(let y=0;y<h;y++){const row=rows[y];let x=0;while(x<row.length){const ch=row[x];if(ch==='.'){x++;continue;}let x2=x+1;while(x2<row.length&&row[x2]===ch)x2++;r+=`<rect x="${x}" y="${y}" width="${x2-x}" height="1" fill="${ICOL[ch]}"/>`;x=x2;}}
  const sc=px/Math.max(w,h);
  const out=`<svg class="px ${cls||''}" viewBox="0 0 ${w} ${h}" width="${Math.round(w*sc)}" height="${Math.round(h*sc)}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${r}</svg>`;
  _icCache[key]=out;return out;
}
const gemIc=(rar,px)=>ic('g_'+rar,px||12,'gem');
const terrIc=(t,px)=>ic(t,px||10,'tic');
/* ---------- v4: ícones novos (palavras-chave, famílias, regras do Desafio, modos) ---------- */
Object.assign(ICONS,{
 guarda:['.kkkkkkk.','keeeeeeEk','kEyEEEyEk','kkkkkkkkk','kswsssSSk','ksssyssSk','.kssysSk.','.kssssSk.','..kssSk..','...kkk...'],
 couraca:['...kkkk...','..kNnnNk..','.kNntnnNk.','knnkNNknnk','kntNnnNtnk','kNnnkknnNk','kkkkkkkkkk','.kgk..kgk.','.kkk..kkk.'],
 raiz:['..kk..kk..','.kmgkkmgk.','.kggggGgk.','..kgkkgk..','.kgGkkGgk.','kgk.kk.kgk','kGkkggkkGk','.kGgGGgGk.','..kkkkkk..'],
 ninhada:['...kkkk...','..kxxxwk..','.kxxxxxwk.','.kxxtxxxk.','kxxxxxxxtk','kxtxxxxxtk','kxxxxxxttk','.kxxxxttk.','..kkkkkk..'],
 grito:['......yo..','..yo...yo.','...yo...y.','kk..yo..yo','krk..y...y','krk..y...y','kk..yo..yo','...yo...y.','..yo...yo.','......yo..'],
 combo:['....kk....','...kYYk...','kkkkYykkkk','kYYYyyyyok','.kYyyyyyk.','..kyyyyk..','.kyyokyyk.','.kyok.kyok','kook...kok','kk......kk'],
 dupla:['.kkkk.kkkk.','kYYyykbbbBk','kYkkkkbkkBk','kyk.kkk.kBk','kyk.kyk.kBk','kykkkyk.kBk','kyyyokbbbBk','.kkkk.kkkk.'],
 familia:['.kkk..kkk.','kewwkkeeek','kewweeeeEk','keeeeeeeEk','.keeeeeEk.','..keeeEk..','...keEk.y.','....kk.yYy','........y.'],
 // famílias
 pena:['.......kk.','......kcck','.....kccbk','....kcwcbk','...kccbbk.','..kcwcbk..','..kccbk...','.kkbbk....','.kNkk.....','kk........'],
 joaninha:['.k......k.','..kkkkkk..','.kkwkkwkk.','keeeekeeek','kekeekeeek','keeeekekek','kekeekeeek','.keeekeek.','..kkkkkk..'],
 sapo:['.kkk..kkk.','kwwgkkwwgk','kwkgggwkgk','.kggggggk.','kggggggggk','kgkkkkkkgk','kgggggggGk','.kGGGGGGk.','..kkkkkk..'],
 chifre:['kk......kk','kxk....kxk','.kxkkkkxk.','..knnnnk..','.knwnnwnk.','.knknnknk.','.knnnnnnk.','..kttttk..','..ktkktk..','...kkkk...'],
 broto:['.kk....kk.','kmmk..kmmk','kmggkkggmk','.kmgkkgmk.','..kkgGkk..','....kGk...','....kGk...','.knnnnnnk.','.kNNNNNNk.','..kkkkkk..'],
 casinha:['....kk....','...kRRk...','..kRrrRk..','.kRrrrrRk.','kkkkkkkkkk','.kxxxxxxk.','.kxbkxnnk.','.kxkkxnnk.','.kxxxxnnk.','.kkkkkkkk.'],
 // regras do Desafio do Dia
 nuvem:['...kkkk...','..kwwwwk..','.kwwwwwskk','kwwwwwwwsk','kwswwwwssk','.kkkkkkkk.','..b..b..b.','.b..b..b..','b..b..b...'],
 sol:['....y.....','.y..y..y..','..kkkkk...','y.kYYyok.y','.kYyyyyok.','.kyyyyyok.','y.koyyook.y','..kkkkk...','.y..y..y..','....y.....'],
 vento:['......kkk.','.kkkkkkcck','kccccccckk','.kkkkkkk..','...kkkkkk.','..kcccccck','...kkkkkck','.......kk.'],
 barraca:['kkkkkkkkkk','kewewewewk','kkkkkkkkkk','.kn....nk.','.kn.yy.nk.','.knkyyknk.','kkkkkkkkkk','knnnnnnnnk','kNNNNNNNNk','kkkkkkkkkk'],
 corvo:['....kkk...','...kPPPk..','..kPwkPPky','kkPPPPPkyy','kPPPPPPPk.','.kPPPPPPk.','..kPPPPPk.','...kkPkk..','....kkk...'],
 lua:['...kkkk...','..kxxxk...','.kxxxk....','kxxxk.....','kxxtk.....','kxxxk.....','kxxxxk....','.kxxxxkkk.','..kxxxxxk.','...kkkkk..'],
 foice:['..kkkkk...','.kssssSk..','kswk..kSk.','kk.....kk.','.....kNk..','....kNk...','...kNk....','..kNk.....','.kNk......','.kk.......'],
 maos:['...kkkk...','.kkkxxkkk.','kxxkxxkxxk','kxxkxekxxk','kxykxxkxbk','kxxkxxkxxk','kxxkkkkxxk','kkkk..kkkk'],
 cerca:['.k..k..k..','kgkkgkkgk.','kmggmggmgk','kgnggngngk','kmgnmgnmgk','kgnggngngk','kGnGGnGnGk','kkkkkkkkkk'],
 muro:['kkkkkkkkkk','ksswksswsk','ksSSkssSSk','kkkkkkkkkk','kswskssswk','kssSkSssSk','kkkkkkkkkk'],
 // modos
 treino:['...kkk....','..kxxxk...','..kxkxk...','...kxk....','kkkknkkkk.','knnnnnnnk.','kkkkntkkk.','...knk....','...knk....','..kkkkk...'],
 desafio:['kkkkkkkkkk','keeeeeeeEk','kkkkkkkkkk','kxxxyxxxxk','kxxyYyxxxk','kxyYyyyxxk','kxxyyyxxxk','kxxxyxxxxk','kxxxxxxxxk','kkkkkkkkkk'],
 torneio:['..kkkkkk..','.kyYYyyok.','kyYkkkkyok','kykbbbbkok','kykbBBbkok','kyykkkkyok','.koyyyyok.','..kkkkkk..','.keEk.keEk','.keEk.keEk','.kek..kek.','..k....k..']
});

/* ---------- v9: ícones vetoriais lisos (cartoon: contorno escuro arredondado + brilho). ic() usa estes; o pixel é só reserva ---------- */
const VO='stroke="#1A1420" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"';
const VH='fill="#FFFFFF" opacity=".55"';
const VICONS={
 coin:`<circle cx="12" cy="12" r="9.6" fill="#F2C230" ${VO}/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#B9801C" stroke-width="1.4"/><path d="M12 7.6c1.7 1.4 1.7 7.4 0 8.8c-1.7-1.4-1.7-7.4 0-8.8z" fill="#B9801C"/><path d="M6 9.5a6.5 6.5 0 0 1 4-3.6" fill="none" stroke="#FFF3B8" stroke-width="1.6" stroke-linecap="round"/>`,
 po:`<path d="M12 2.8l2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.1 6.1-.7z" fill="#B36BE8" ${VO}/><path d="M12 6.5l1.3 2.9 2.4.3" fill="none" stroke="#E6CCFF" stroke-width="1.5" stroke-linecap="round"/><circle cx="20" cy="19.5" r="1.3" fill="#E6CCFF"/><circle cx="4" cy="19" r="1" fill="#E6CCFF"/>`,
 trofeu:`<path d="M7 3.5h10v5a5 5 0 0 1-10 0z" fill="#F2C230" ${VO}/><path d="M7 5.5H4.2a3 3 0 0 0 3.3 4.3M17 5.5h2.8a3 3 0 0 1-3.3 4.3" fill="none" ${VO}/><path d="M10.5 13.2h3v3.6h-3z" fill="#B9801C" ${VO}/><rect x="7" y="16.8" width="10" height="3.7" rx="1.4" fill="#F2C230" ${VO}/><path d="M9.3 5.2v3.3" stroke="#FFF3B8" stroke-width="1.6" stroke-linecap="round"/>`,
 energia:`<path d="M12 2.5c3.5 4.4 6.5 8 6.5 11.5a6.5 6.5 0 0 1-13 0c0-3.5 3-7.1 6.5-11.5z" fill="#4FB3E8" ${VO}/><path d="M9 13.5a3 3 0 0 0 2 3" fill="none" stroke="#DDF3FF" stroke-width="1.7" stroke-linecap="round"/>`,
 espada:`<path d="M19.8 3.2l-1 4.6-8.4 8.4-2.6-2.6 8.4-8.4z" fill="#E6ECEF" ${VO}/><path d="M17.5 5.5l-8.2 8.2" stroke="#9AA6AA" stroke-width="1.1"/><path d="M5.6 12.4l6 6" ${VO} fill="none" stroke-width="2.6"/><path d="M5.6 12.4l6 6" stroke="#C9A050" stroke-width="1.3" stroke-linecap="round"/><path d="M7.6 16.4l-3.4 3.4" stroke="#1A1420" stroke-width="3.6" stroke-linecap="round"/><path d="M7.6 16.4l-3.4 3.4" stroke="#8E5F38" stroke-width="1.8" stroke-linecap="round"/>`,
 coracao:`<path d="M12 20.3S3.2 14.8 3.2 8.8A4.6 4.6 0 0 1 12 6.5a4.6 4.6 0 0 1 8.8 2.3c0 6-8.8 11.5-8.8 11.5z" fill="#E0565B" ${VO}/><path d="M6.6 8.2a2 2 0 0 1 2-1.8" fill="none" stroke="#FFC2C2" stroke-width="1.7" stroke-linecap="round"/>`,
 furia:`<path d="M12 2.5c1 3.5 5.8 5.5 5.8 11a5.8 5.8 0 0 1-11.6 0c0-3 1.6-4.4 2.6-5.6.3 1.8 1 2.8 2 3.2-.6-3.4.2-6 1.2-8.6z" fill="#E8693A" ${VO}/><path d="M12 11.5c1.3 1.6 2.9 2.6 2.9 4.6a2.9 2.9 0 0 1-5.8 0c0-1.6 1.6-2.8 2.9-4.6z" fill="#FFD35A"/>`,
 voar:`<path d="M3 15.5C6 8 12 4.5 21 4c-1.2 2-2.4 3-4 3.6 1 .3 1.8 0 2.6-.3-1.4 2.2-3 3.4-5 3.8 1 .3 1.8.3 2.6.1-2.2 3-5.6 4.6-10.2 4.3z" fill="#FFFFFF" ${VO}/><path d="M7 14.5c2.6-.4 5.4-2 7.4-4.6" fill="none" stroke="#9FC4D8" stroke-width="1.3" stroke-linecap="round"/><path d="M3 15.5l-1 4" ${VO} fill="none"/>`,
 espinhos:`<path d="M2.5 20.5L6 8l3 7 3-11.5 3 11.5 3-7 3.5 12.5z" fill="#6CB843" ${VO}/><path d="M12 7.5l1.4 6" stroke="#B8E890" stroke-width="1.3" stroke-linecap="round"/>`,
 brotar:`<path d="M12 21v-8" ${VO} fill="none" stroke-width="2.6"/><path d="M12 21v-8" stroke="#4E9A3A" stroke-width="1.2"/><path d="M12 13C10 7 5 6 3 6.5c.4 4.5 4 7.5 9 6.5z" fill="#9BD34B" ${VO}/><path d="M12 12c1.4-5.5 5.6-7.6 9-7-1 4.8-4.6 7.6-9 7z" fill="#6CB843" ${VO}/><path d="M6 19.5h12" ${VO} stroke-width="2.4"/><path d="M6 19.5h12" stroke="#8E5F38" stroke-width="1.2" stroke-linecap="round"/>`,
 pisotear:`<path d="M5 4.5h5.2v9.5c0 3-1.2 5.5-2.6 5.5S5 17 5 14zM13.8 4.5H19V14c0 3-1.2 5.5-2.6 5.5s-2.6-2.5-2.6-5.5z" fill="#C9CFC9" ${VO}/><path d="M5 9h5.2M13.8 9H19" stroke="#7D8A8C" stroke-width="1.4"/>`,
 ataqueDuplo:`<path d="M20.5 3.5L8.5 15.5M15.5 3.5L3.5 15.5" stroke="#1A1420" stroke-width="4.6" stroke-linecap="round"/><path d="M20.5 3.5L8.5 15.5M15.5 3.5L3.5 15.5" stroke="#E8693A" stroke-width="2.4" stroke-linecap="round"/><path d="M12 17l3 3.5M7 17l3 3.5" stroke="#FFD35A" stroke-width="1.8" stroke-linecap="round"/>`,
 bloqueiaVoo:`<path d="M12 2.8l7.8 3v5.8c0 4.8-3.3 8.2-7.8 9.6-4.5-1.4-7.8-4.8-7.8-9.6V5.8z" fill="#C9CFC9" ${VO}/><path d="M7.5 13c2.4-4 5.6-5.6 9-6-1 2.6-3.4 5-9 6z" fill="#FFFFFF" stroke="#7D8A8C" stroke-width="1.2" stroke-linejoin="round"/><path d="M6.5 16.5l11-9" stroke="#C4362F" stroke-width="2" stroke-linecap="round"/>`,
 habilidade:`<path d="M6 3.5h11.5a2.5 2.5 0 0 1 0 5H17v10a2 2 0 0 1-2 2H5.5a2.5 2.5 0 0 1 0-5H6z" fill="#F3E7CD" ${VO}/><path d="M9 8h5M9 11h5M9 14h3.5" stroke="#B9801C" stroke-width="1.5" stroke-linecap="round"/>`,
 milharal:`<path d="M12 2.5c2.6 0 3.8 3.6 3.8 7.5S14.6 18 12 18s-3.8-4.1-3.8-8S9.4 2.5 12 2.5z" fill="#F2C230" ${VO}/><path d="M10.2 7h3.6M9.8 10h4.4M10.2 13h3.6M12 4v12" stroke="#B9801C" stroke-width="1.1" stroke-linecap="round"/><path d="M12 21.5c-4.6-1-6.5-5-6-10 2.2 2 3.6 4.4 6 7.5 2.4-3.1 3.8-5.5 6-7.5.5 5-1.4 9-6 10z" fill="#6CB843" ${VO}/>`,
 pomar:`<path d="M12 7.2c3-2 8 .2 8 5.4 0 4.2-3 8.4-5.4 8.4-1.2 0-1.8-.6-2.6-.6s-1.4.6-2.6.6C7 21 4 16.8 4 12.6c0-5.2 5-7.4 8-5.4z" fill="#E0565B" ${VO}/><path d="M12 7.2c0-2 .6-3.4 1.6-4.6" ${VO} fill="none"/><path d="M13 5c1.6-2 4-2.2 5.4-1.4-1 2-3 2.6-5.4 1.4z" fill="#6CB843" ${VO}/><path d="M7 11.5a3 3 0 0 1 2-2.4" fill="none" stroke="#FFC2C2" stroke-width="1.7" stroke-linecap="round"/>`,
 brejo:`<path d="M12 3c3.2 4.2 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.8-6.8 6-11z" fill="#3BA39A" ${VO}/><path d="M9.2 13.4a3 3 0 0 0 1.8 3" fill="none" stroke="#BFF0E8" stroke-width="1.7" stroke-linecap="round"/>`,
 pasto:`<path d="M3 20.5c.4-4 1.6-7 3.6-9.4.2 3 .8 4.6 1.8 5.8.4-5 2-8.6 4.2-11.4.6 4.4 1.2 7.8 2.6 10.6.8-2.2 2.2-4 4.4-5.6-.6 3.6-1 6.6-.6 10z" fill="#6CB843" ${VO}/><path d="M13.6 7.5c.2 3 .7 5.6 1.4 7.4" stroke="#B8E890" stroke-width="1.2" stroke-linecap="round" fill="none"/>`,
 neutro:`<path d="M3.5 10.5L12 4l8.5 6.5V20h-17z" fill="#C4362F" ${VO}/><path d="M9 20v-6h6v6" fill="#F3E7CD" ${VO}/><path d="M9 14l6 6M15 14l-6 6" stroke="#8E5F38" stroke-width="1.2"/><path d="M3.5 10.5L12 4l8.5 6.5" fill="none" stroke="#F3E7CD" stroke-width="1.2" stroke-linecap="round" transform="translate(0 2)"/>`,
 g_comum:`<circle cx="12" cy="12" r="7.5" fill="#B8B2A6" ${VO}/><path d="M8.5 10a4 4 0 0 1 3-3" fill="none" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round"/>`,
 g_incomum:`<path d="M12 3.5l7.5 8.5-7.5 8.5-7.5-8.5z" fill="#5DBB63" ${VO}/><path d="M12 6.5l-4.2 5" stroke="#C9F5C2" stroke-width="1.7" stroke-linecap="round"/>`,
 g_rara:`<path d="M5 9l3-4.5h8L19 9l-7 10.5z" fill="#4C9BE8" ${VO}/><path d="M5 9h14M9.5 9L12 19.5 14.5 9" fill="none" stroke="#1F6FA8" stroke-width="1.1"/><path d="M8.6 6.5L7.4 8.4" stroke="#DDF3FF" stroke-width="1.7" stroke-linecap="round"/>`,
 g_epica:`<path d="M12 2.8l3 6.2 6.2 3-6.2 3-3 6.2-3-6.2-6.2-3 6.2-3z" fill="#B36BE8" ${VO}/><path d="M12 6.4l-1.4 3.6" stroke="#F0E0FF" stroke-width="1.7" stroke-linecap="round"/>`,
 g_lendaria:`<path d="M3 8l4.5 4L12 4.5 16.5 12 21 8l-2 10.5H5z" fill="#F2C230" ${VO}/><rect x="5" y="17.2" width="14" height="3" rx="1.2" fill="#B9801C" ${VO}/><circle cx="12" cy="12.8" r="1.6" fill="#E0565B"/>`,
 inicio:`<path d="M3 11.5L12 3.5l9 8V21h-6.2v-6H9.2v6H3z" fill="currentColor"/>`,
 cartas:`<rect x="8.5" y="2.5" width="12" height="15.5" rx="2.2" fill="currentColor" opacity=".55" transform="rotate(10 14.5 10)"/><rect x="3.5" y="5" width="12" height="16" rx="2.2" fill="currentColor"/>`,
 loja:`<path d="M8 8V6.5a4 4 0 0 1 8 0V8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M3.5 8h17l-1.3 11.4a2 2 0 0 1-2 1.6H6.8a2 2 0 0 1-2-1.6z" fill="currentColor"/>`,
 mercado:`<path d="M2.5 4h19l-1.5 5a2.6 2.6 0 0 1-4.7 0 2.6 2.6 0 0 1-4.6 0 2.6 2.6 0 0 1-4.6 0A2.6 2.6 0 0 1 1.5 9z" fill="currentColor"/><path d="M4 11v9.5h16V11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><rect x="9.5" y="14" width="5" height="6.5" rx="1" fill="currentColor"/>`,
 economia:`<rect x="3" y="13" width="4.2" height="8" rx="1.3" fill="currentColor"/><rect x="9.9" y="8.5" width="4.2" height="12.5" rx="1.3" fill="currentColor"/><rect x="16.8" y="3.5" width="4.2" height="17.5" rx="1.3" fill="currentColor"/>`,
 som:`<path d="M3 9h4l5.5-4.5v15L7 15H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.3 5.8a9 9 0 0 1 0 12.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`,
 mudo:`<path d="M3 9h4l5.5-4.5v15L7 15H3z" fill="currentColor"/><path d="M15.5 9l5 6M20.5 9l-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>`,
 musica:`<path d="M9 17.5V5.5l11-2.5v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="6.3" cy="17.8" rx="3.3" ry="2.7" fill="currentColor"/><ellipse cx="17.3" cy="15.3" rx="3.3" ry="2.7" fill="currentColor"/>`,
 semmusica:`<path d="M9 17.5V5.5l11-2.5v12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" opacity=".6"/><ellipse cx="6.3" cy="17.8" rx="3.3" ry="2.7" fill="currentColor" opacity=".6"/><ellipse cx="17.3" cy="15.3" rx="3.3" ry="2.7" fill="currentColor" opacity=".6"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>`,
 bandeira:`<path d="M5 21.5V3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M6 4h12.5l-2.6 4 2.6 4H6z" fill="#FFFFFF" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
 mao:`<path d="M9 13V4.6a1.8 1.8 0 0 1 3.6 0V11l.2-1.2a1.7 1.7 0 0 1 3.3.4l-.1 1.4.3-.7a1.6 1.6 0 0 1 3 .9l-.6 5c-.4 3-2.6 5-5.6 5h-1.4c-2 0-3.4-.8-4.5-2.4L4.4 15a1.7 1.7 0 0 1 2.8-1.9z" fill="#FFFFFF" ${VO}/><path d="M12.6 11v3M16 11.4v2.6" stroke="#B8B2A6" stroke-width="1.2" stroke-linecap="round"/>`,
 cadeado:`<path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" fill="none" stroke="#1A1420" stroke-width="4"/><path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" fill="none" stroke="#C9CFC9" stroke-width="1.8"/><rect x="4.5" y="10" width="15" height="11" rx="2.4" fill="#F2C230" ${VO}/><circle cx="12" cy="14.6" r="1.6" fill="#1A1420"/><path d="M12 15.5v2.6" stroke="#1A1420" stroke-width="1.8" stroke-linecap="round"/>`,
 guarda:`<path d="M12 2.8l7.8 3v5.8c0 4.8-3.3 8.2-7.8 9.6-4.5-1.4-7.8-4.8-7.8-9.6V5.8z" fill="#C9CFC9" ${VO}/><path d="M12 2.8l7.8 3V9H4.2V5.8z" fill="#E0565B" ${VO}/><path d="M12 11v8" stroke="#F2C230" stroke-width="2" stroke-linecap="round"/>`,
 couraca:`<path d="M2.8 15.5C3.6 9 7.4 5 12 5s8.4 4 9.2 10.5z" fill="#A0673A" ${VO}/><path d="M12 5v10.5M7 7.5l2.4 8M17 7.5l-2.4 8M4.5 11h15" stroke="#6B4630" stroke-width="1.3" fill="none"/><path d="M5.5 15.5l-1 3M18.5 15.5l1 3" ${VO}/><path d="M2.5 15.5h19" ${VO}/>`,
 raiz:`<path d="M12 3v9" ${VO} stroke-width="3.2"/><path d="M12 3v9" stroke="#6B4630" stroke-width="1.6" stroke-linecap="round"/><path d="M12 11c-1 4-4 5-6.5 9M12 11c1 4 4 5 6.5 9M12 12v8.5" fill="none" stroke="#1A1420" stroke-width="3.2" stroke-linecap="round"/><path d="M12 11c-1 4-4 5-6.5 9M12 11c1 4 4 5 6.5 9M12 12v8.5" fill="none" stroke="#A0673A" stroke-width="1.5" stroke-linecap="round"/><path d="M12 6c-2-2.5-5-3-7-2.4 1 2.6 4 3.4 7 2.4zM12 6c2-2.5 5-3 7-2.4-1 2.6-4 3.4-7 2.4z" fill="#6CB843" ${VO}/>`,
 ninhada:`<path d="M12 3c3.6 0 6.5 5.4 6.5 10a6.5 6.5 0 0 1-13 0C5.5 8.4 8.4 3 12 3z" fill="#F4E3B5" ${VO}/><circle cx="9.5" cy="12" r="1.1" fill="#D9A066"/><circle cx="14.5" cy="15" r="1.4" fill="#D9A066"/><circle cx="13" cy="8.5" r=".9" fill="#D9A066"/><path d="M8.5 7.8a3 3 0 0 1 1.6-2" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>`,
 grito:`<path d="M3 10v4h3l7 5V5L6 10z" fill="#E8693A" ${VO}/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" fill="none" stroke="#F2C230" stroke-width="2.2" stroke-linecap="round"/>`,
 combo:`<path d="M12 2.5l2.4 5.2 5.6-1.4-2.6 5.2 4.1 3.6-5.6.6.2 5.8-4.1-4-4.1 4 .2-5.8-5.6-.6 4.1-3.6-2.6-5.2 5.6 1.4z" fill="#F2C230" ${VO}/><circle cx="12" cy="12.2" r="2.6" fill="#FFF3B8"/>`,
 dupla:`<rect x="2.5" y="5" width="9.5" height="14" rx="2" fill="#F2C230" ${VO} transform="rotate(-8 7 12)"/><rect x="12" y="5" width="9.5" height="14" rx="2" fill="#4FB3E8" ${VO} transform="rotate(8 17 12)"/>`,
 familia:`<path d="M10 18.5S3 14.2 3 9.4A3.7 3.7 0 0 1 10 7.6a3.7 3.7 0 0 1 7 1.8c0 4.8-7 9.1-7 9.1z" fill="#E0565B" ${VO}/><path d="M18.5 13.5l1.2 2.5 2.6.3-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.3z" fill="#F2C230" ${VO} stroke-width="1.3"/>`,
 pena:`<path d="M20 3.5C11 4 6 9.5 5 17.5l2.5-.5C13 15 18 10 20 3.5z" fill="#4FB3E8" ${VO}/><path d="M18 5.5L4 20.5" stroke="#1A1420" stroke-width="1.8" stroke-linecap="round"/><path d="M15 9l-2.5-.4M12.5 12l-2.6-.3" stroke="#DDF3FF" stroke-width="1.3" stroke-linecap="round"/>`,
 joaninha:`<circle cx="12" cy="7" r="3.3" fill="#1A1420"/><path d="M12 6.5c4.4 0 7.5 3.6 7.5 7.5s-3.4 7-7.5 7-7.5-3.1-7.5-7 3.1-7.5 7.5-7.5z" fill="#E0565B" ${VO}/><path d="M12 6.8V21" stroke="#1A1420" stroke-width="1.5"/><circle cx="8.6" cy="12.5" r="1.4" fill="#1A1420"/><circle cx="15.4" cy="12.5" r="1.4" fill="#1A1420"/><circle cx="9.2" cy="17" r="1.2" fill="#1A1420"/><circle cx="14.8" cy="17" r="1.2" fill="#1A1420"/><path d="M10 3.5L9 2M14 3.5L15 2" stroke="#1A1420" stroke-width="1.4" stroke-linecap="round"/>`,
 sapo:`<path d="M3 15c0-4 3-6.5 9-6.5s9 2.5 9 6.5-4 5.5-9 5.5-9-1.5-9-5.5z" fill="#6CB843" ${VO}/><circle cx="7.5" cy="8" r="3.3" fill="#6CB843" ${VO}/><circle cx="16.5" cy="8" r="3.3" fill="#6CB843" ${VO}/><circle cx="7.8" cy="8" r="1.5" fill="#1A1420"/><circle cx="16.2" cy="8" r="1.5" fill="#1A1420"/><path d="M8 15.5c2.6 1.6 5.4 1.6 8 0" fill="none" stroke="#1A1420" stroke-width="1.4" stroke-linecap="round"/>`,
 chifre:`<path d="M6 9C3.5 8 2.5 5.5 3 3c1.5 2 3.2 2.6 5 2.6M18 9c2.5-1 3.5-3.5 3-6-1.5 2-3.2 2.6-5 2.6" fill="#F3E7CD" ${VO}/><path d="M12 5.5c4 0 6.5 2.6 6.5 6.6 0 4.6-2.8 8.4-6.5 8.4s-6.5-3.8-6.5-8.4c0-4 2.5-6.6 6.5-6.6z" fill="#A0673A" ${VO}/><ellipse cx="12" cy="16.5" rx="3.5" ry="2.6" fill="#D9A066" stroke="#1A1420" stroke-width="1.4"/><circle cx="9.3" cy="11" r="1.1" fill="#1A1420"/><circle cx="14.7" cy="11" r="1.1" fill="#1A1420"/>`,
 broto:`<path d="M6 14.5h12l-1.4 6.5H7.4z" fill="#C98A4E" ${VO}/><path d="M12 14.5v-5" ${VO}/><path d="M12 10C10.6 6 7 5.4 5 6c.6 3.4 3.4 5 7 4zM12 9.4c1.2-3.8 4.4-5 7-4.4-.8 3.4-3.6 4.8-7 4.4z" fill="#6CB843" ${VO}/>`,
 casinha:`<path d="M2.5 11.5L12 3.5l9.5 8" fill="#C4362F" ${VO}/><path d="M5 10v10.5h14V10" fill="#F3E7CD" ${VO}/><rect x="10" y="14" width="4" height="6.5" rx=".8" fill="#A0673A" ${VO} stroke-width="1.3"/><rect x="6.5" y="12" width="2.6" height="2.6" rx=".5" fill="#4FB3E8"/>`,
 nuvem:`<path d="M6.5 15.5a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.6-1 4.5 4.5 0 0 1 .8 9z" fill="#FFFFFF" ${VO}/><path d="M8 18.5l-1 2.5M12 18.5l-1 2.5M16 18.5l-1 2.5" stroke="#4FB3E8" stroke-width="2" stroke-linecap="round"/>`,
 sol:`<circle cx="12" cy="12" r="5" fill="#F2C230" ${VO}/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="#E8862E" stroke-width="2.2" stroke-linecap="round"/>`,
 vento:`<path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" fill="none" stroke="#1A1420" stroke-width="3.6" stroke-linecap="round"/><path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" fill="none" stroke="#BFE6FA" stroke-width="1.8" stroke-linecap="round"/>`,
 barraca:`<path d="M3 9.5l2-5.5h14l2 5.5z" fill="#E0565B" ${VO}/><path d="M7.5 4l-.8 5.5M12 4v5.5M16.5 4l.8 5.5" stroke="#FFFFFF" stroke-width="1.6"/><path d="M5 9.5v11M19 9.5v11" ${VO}/><rect x="3.5" y="14" width="17" height="6.5" rx="1.2" fill="#A0673A" ${VO}/><circle cx="9" cy="12.5" r="1.6" fill="#F2C230" ${VO} stroke-width="1.2"/><circle cx="15" cy="12.5" r="1.6" fill="#E8693A" ${VO} stroke-width="1.2"/>`,
 corvo:`<path d="M3 13c2-5 6-7.5 10-7.5 3.5 0 5.5 1.6 6.4 4L22 11l-2.6 1.2c-.8 4.4-4.4 7.3-9 7.3H7l-2 2v-3c-1.4-1-2-2.6-2-5.5z" fill="#5A3E8C" ${VO}/><circle cx="16" cy="9.5" r="1.3" fill="#FFFFFF"/><circle cx="16.2" cy="9.6" r=".6" fill="#1A1420"/><path d="M8 13c2 .4 4-.2 5.6-1.6" fill="none" stroke="#A77BE0" stroke-width="1.4" stroke-linecap="round"/>`,
 lua:`<path d="M15.5 3a8.6 8.6 0 1 0 5.5 13.6A7 7 0 0 1 15.5 3z" fill="#F4E3B5" ${VO}/><circle cx="10" cy="14" r="1.3" fill="#D9C79A"/><circle cx="13" cy="18" r=".9" fill="#D9C79A"/>`,
 foice:`<path d="M4 6.5C8 3 15 2.8 19 6.5c-4-1.5-9-1-12 3z" fill="#E6ECEF" ${VO}/><path d="M7.5 9.2L18 21" stroke="#1A1420" stroke-width="3.6" stroke-linecap="round"/><path d="M7.5 9.2L18 21" stroke="#8E5F38" stroke-width="1.8" stroke-linecap="round"/>`,
 maos:`<path d="M3 13l4-4.5 3 1 2-1.5 2 1.5 3-1 4 4.5-6 6.5h-6z" fill="#F4C9A0" ${VO}/><path d="M9 12.5l3 3 3-3" fill="none" stroke="#B9801C" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
 cerca:`<path d="M4 8l2-3 2 3v12.5H4zM10 8l2-3 2 3v12.5h-4zM16 8l2-3 2 3v12.5h-4z" fill="#D9A066" ${VO}/><path d="M2.5 11h19M2.5 16.5h19" ${VO} stroke-width="2.6"/><path d="M2.5 11h19M2.5 16.5h19" stroke="#A0673A" stroke-width="1.2"/>`,
 muro:`<rect x="3" y="5" width="18" height="15" rx="2" fill="#B8B2A6" ${VO}/><path d="M3 10h18M3 15h18M9 5v5M15 5v5M6 10v5M12 10v5M18 10v5M9 15v5M15 15v5" stroke="#7A746A" stroke-width="1.3"/>`,
 treino:`<circle cx="12" cy="12" r="9" fill="#F3E7CD" ${VO}/><circle cx="12" cy="12" r="5.8" fill="#E0565B" stroke="#1A1420" stroke-width="1.3"/><circle cx="12" cy="12" r="2.6" fill="#F3E7CD" stroke="#1A1420" stroke-width="1.2"/>`,
 desafio:`<rect x="3.5" y="5" width="17" height="15.5" rx="2.4" fill="#F3E7CD" ${VO}/><path d="M3.5 7.4a2.4 2.4 0 0 1 2.4-2.4h12.2a2.4 2.4 0 0 1 2.4 2.4V10h-17z" fill="#E0565B" ${VO}/><path d="M8 3v4M16 3v4" ${VO}/><path d="M12 12l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="#F2C230" stroke="#1A1420" stroke-width="1.1" stroke-linejoin="round"/>`,
 torneio:`<path d="M8 2.5h3l1 5h-4zM16 2.5h-3l-1 5h4z" fill="#4FB3E8" ${VO}/><circle cx="12" cy="14.5" r="6.5" fill="#F2C230" ${VO}/><circle cx="12" cy="14.5" r="4" fill="none" stroke="#B9801C" stroke-width="1.3"/><path d="M9 12.5a3.6 3.6 0 0 1 2-1.6" fill="none" stroke="#FFF3B8" stroke-width="1.5" stroke-linecap="round"/>`
};
/* v10 (Agente 6): ícones novos de Mata Adentro + os 5 reinos redesenhados (sem milho/maçã/celeiro) */
Object.assign(VICONS,{
 // reinos: Sertão = mandacaru sob sol baixo · Mata = folha larga · Águas = onda · Noite = lua crescente com estrela · Arraial = bandeirinhas
 milharal:`<circle cx="18.2" cy="5.2" r="3.2" fill="#F2C230" ${VO}/><path d="M9.6 14.2H7a2.2 2.2 0 0 1-2.2-2.2V8.4a1.9 1.9 0 0 1 3.8 0v2h1M14.4 16.4h2.4a2.2 2.2 0 0 0 2.2-2.2v-3a1.9 1.9 0 0 0-3.8 0v1.4h-.8" fill="#5E9A3A" ${VO}/><path d="M9.6 21.5V6.2a2.4 2.4 0 0 1 4.8 0v15.3z" fill="#5E9A3A" ${VO}/><path d="M12 6.4v13.4" stroke="#A8D878" stroke-width="1.2" stroke-linecap="round"/><path d="M2.5 21.5h19" ${VO} fill="none"/>`,
 pomar:`<path d="M12 21.5C5 18 3.5 11 6 4c4.5.5 12 3.8 12 10.5 0 4-2.7 6.4-6 7z" fill="#3FA34D" ${VO}/><path d="M12 21.5C10 15 8.5 10 6.5 5" fill="none" stroke="#1A1420" stroke-width="1.5" stroke-linecap="round"/><path d="M9 12.5l3.5-1.2M10.5 16.5l4-1" stroke="#9BE08A" stroke-width="1.3" stroke-linecap="round"/>`,
 brejo:`<path d="M2.5 13.5c2.5-6 7-7.5 10-5.5-2.8-.2-3.8 2.6-2 4.2 1.6 1.4 4 .4 4.5-1.4 1.6 2.8 4 3.6 6.5 2.7v7h-19z" fill="#2E9FB5" ${VO}/><path d="M5 17c2-1 4-1 6 0s4 1 6 0" fill="none" stroke="#BFF0F8" stroke-width="1.6" stroke-linecap="round"/>`,
 pasto:`<path d="M14.5 3a9 9 0 1 0 6.5 13.6A7.4 7.4 0 0 1 14.5 3z" fill="#7B5BD6" ${VO}/><path d="M17.5 5.2l.8 1.7 1.8.3-1.3 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.3-1.2 1.8-.3z" fill="#F4E3B5"/><path d="M6.8 11.5a5 5 0 0 1 2.4-3.6" fill="none" stroke="#C9B8FF" stroke-width="1.6" stroke-linecap="round"/>`,
 neutro:`<path d="M1.5 4.6Q12 9.6 22.5 4.6" fill="none" ${VO}/><path d="M2 5.2l5.8 1.6-3.4 7.4z" fill="#E8693A" ${VO} stroke-width="1.4"/><path d="M9 7.2h6l-3 7.8z" fill="#F2C230" ${VO} stroke-width="1.4"/><path d="M16.2 6.8l5.8-1.6-2.4 9z" fill="#4FB3E8" ${VO} stroke-width="1.4"/><path d="M6.5 21.6l11-2.2M6.5 19.4l11 2.2" stroke="#1A1420" stroke-width="3" stroke-linecap="round"/><path d="M6.5 21.6l11-2.2M6.5 19.4l11 2.2" stroke="#A0673A" stroke-width="1.4" stroke-linecap="round"/><path d="M12 20c-1.8 0-2.6-1-2.6-2.2 0-1.4 1.4-2.2 2.6-4 1.2 1.8 2.6 2.6 2.6 4 0 1.2-.8 2.2-2.6 2.2z" fill="#FF9A30" stroke="#1A1420" stroke-width="1.2"/>`,
 asa:`<path d="M3 17.5C4 9.5 10 4 20.5 3.5c-.6 2.6-2.2 4-4.2 4.6 1.2.4 2.4.3 3.4-.2-1.2 2.8-3.4 4.4-6 4.8 1 .5 2.2.6 3.2.4-2.8 3.4-8 5.2-13.9 4.4z" fill="#E8DFC8" ${VO}/><path d="M6 15.5c3.6-.6 7.4-3.4 10-7.8" fill="none" stroke="#A89878" stroke-width="1.2" stroke-linecap="round"/>`,
 gota:`<path d="M12 2.5c3.5 4.6 6.5 8.2 6.5 11.8a6.5 6.5 0 0 1-13 0c0-3.6 3-7.2 6.5-11.8z" fill="#2E9FB5" ${VO}/><path d="M8.9 13.6a3.2 3.2 0 0 0 2 3.2" fill="none" stroke="#C8F2FA" stroke-width="1.8" stroke-linecap="round"/>`,
 chapeu:`<path d="M2.5 15.5c3 2.6 16 2.6 19 0-1.4-1.2-3.2-1.6-4.6-1.6" fill="#B9802E" ${VO}/><path d="M7 14c0-5 1.6-9 5-9s5 4 5 9c-3 .9-7 .9-10 0z" fill="#C9902E" ${VO}/><path d="M7.4 11.6c3 .8 6.2.8 9.2 0" fill="none" stroke="#6B4630" stroke-width="1.6"/><path d="M4 15.2l1.6 1M8 16.4l.6 1.2M12 16.8v1.2M16 16.4l-.6 1.2M20 15.2l-1.6 1" stroke="#F2D07A" stroke-width="1.2" stroke-linecap="round"/>`,
 vintem:`<circle cx="12" cy="12" r="9.4" fill="#C8783A" ${VO}/><circle cx="12" cy="12" r="6.4" fill="none" stroke="#8A4A1E" stroke-width="1.4"/><text x="12" y="15.6" text-anchor="middle" font-family="Rye,Georgia,serif" font-size="9.5" font-weight="700" fill="#5A2E12">20</text><path d="M7 8.4a6 6 0 0 1 3-2.4" fill="none" stroke="#F4C08A" stroke-width="1.5" stroke-linecap="round"/>`,
 brasa:`<path d="M4.5 16c0-3 2.6-4.5 4-6 .6 1.4 1.4 2 2.4 2.2C10.4 9 12 6 14.6 4c-.2 3 1 4.6 2.6 6.4 1.4 1.6 2.3 3.2 2.3 5.4a5.6 5.6 0 0 1-5.6 5.4H10a5.5 5.5 0 0 1-5.5-5.2z" fill="#E8862E" ${VO}/><path d="M9.5 17.5c0-2 1.4-3 2.5-4.4 1.1 1.4 2.5 2.4 2.5 4.4a2.5 2.5 0 0 1-5 0z" fill="#FFD040"/><circle cx="18.5" cy="4.5" r="1" fill="#FF9A30"/><circle cx="6" cy="6.5" r=".8" fill="#FF9A30"/>`,
 fogueira:`<path d="M4 20.5l16-3.5M4 17l16 3.5" stroke="#1A1420" stroke-width="3.8" stroke-linecap="round"/><path d="M4 20.5l16-3.5M4 17l16 3.5" stroke="#A0673A" stroke-width="2" stroke-linecap="round"/><path d="M12 18c-3.6 0-5.4-2.4-5.4-5 0-2.6 2-4 3-6 .5 1.4 1.2 2 2 2.2C11.4 6.6 12.6 4.4 14.6 3c-.2 2.6.8 4 2 5.6 1 1.2 1.8 2.6 1.8 4.4 0 2.8-2.4 5-6.4 5z" fill="#E8862E" ${VO}/><path d="M12 17.2c-1.6 0-2.4-1-2.4-2.2 0-1.4 1.2-2.2 2.4-3.6 1.2 1.4 2.4 2.2 2.4 3.6 0 1.2-.8 2.2-2.4 2.2z" fill="#FFD040"/>`,
 relogio:`<circle cx="12" cy="12.5" r="8.6" fill="#2A2048" ${VO}/><path d="M12 6.2v6.3l3.6 2.4" fill="none" stroke="#F4E3B5" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 4.6v1.2M20 12.5h-1.2M12 20.4v-1.2M4 12.5h1.2" stroke="#9C88E0" stroke-width="1.4" stroke-linecap="round"/><path d="M17.6 2.8a3 3 0 1 0 2.6 4.6 2.4 2.4 0 0 1-2.6-4.6z" fill="#F4E3B5" stroke="#1A1420" stroke-width="1"/>`,
 'lua-onda':`<path d="M13 2.5a7 7 0 1 0 5.6 11.2A5.6 5.6 0 0 1 13 2.5z" fill="#B9A6F0" ${VO}/><path d="M2.5 16.5c2-1.6 3.8-1.6 5.8 0s3.8 1.6 5.8 0 3.8-1.6 5.8 0M2.5 20.5c2-1.6 3.8-1.6 5.8 0s3.8 1.6 5.8 0 3.8-1.6 5.8 0" fill="none" stroke="#1A1420" stroke-width="3.4" stroke-linecap="round"/><path d="M2.5 16.5c2-1.6 3.8-1.6 5.8 0s3.8 1.6 5.8 0 3.8-1.6 5.8 0M2.5 20.5c2-1.6 3.8-1.6 5.8 0s3.8 1.6 5.8 0 3.8-1.6 5.8 0" fill="none" stroke="#5EC8D8" stroke-width="1.6" stroke-linecap="round"/>`,
 vila:`<path d="M3 21V11l4.5-3.5L12 11v10" fill="currentColor" opacity=".55"/><path d="M10 21V9.5L15.5 5l5.5 4.5V21z" fill="currentColor"/><path d="M14 21v-4.5h3V21" fill="#1A1420" opacity=".55"/><path d="M5.5 21v-3h2v3" fill="#1A1420" opacity=".45"/><path d="M15.5 2.5v2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
 barco:`<path d="M2.5 13.5h19c-1.4 4-4.4 6-9.5 6s-8.1-2-9.5-6z" fill="#A0673A" ${VO}/><path d="M12 13.5V3.5l6.5 7.5z" fill="#F3E7CD" ${VO}/><path d="M5 16.2h14" stroke="#6B4630" stroke-width="1.1"/><path d="M2.5 21.5c2-1.2 4-1.2 6 0s4 1.2 6 0 4-1.2 6.5 0" fill="none" stroke="#2E9FB5" stroke-width="1.6" stroke-linecap="round"/>`,
 casa:`<path d="M2.5 11.5L12 4l9.5 7.5" fill="#B9802E" ${VO}/><path d="M5 10.2v10.3h14V10.2" fill="#E0B07A" ${VO}/><rect x="10" y="14" width="4" height="6.5" rx=".6" fill="#6B4630" ${VO} stroke-width="1.3"/><rect x="6.4" y="12.4" width="2.4" height="2.4" fill="#FFD040" stroke="#1A1420" stroke-width="1"/><path d="M6 10.8l12 0" stroke="#8A5A2E" stroke-width="1"/>`,
 torre:`<path d="M8 21.5l1.2-13h5.6l1.2 13z" fill="#E0B07A" ${VO}/><path d="M6.5 9L12 3l5.5 6z" fill="#C4562F" ${VO}/><rect x="10.6" y="11" width="2.8" height="3" fill="#FFD040" stroke="#1A1420" stroke-width="1"/><path d="M9 17h6" stroke="#8A5A2E" stroke-width="1.1"/>`
});

/* ---------- arte das cartas ---------- */
const T0=performance.now();
const artT=()=>(RM||document.hidden)?0:(performance.now()-T0)/1000;
const PAL={ol:'#1A1420',sd:'#3B2A2F',wd:'#6B4630',wo:'#A0673A',st:'#D9A066',cr:'#F4E3B5',wh:'#FFFFFF',yl:'#F2C230',or:'#E8862E',rd:'#C4362F',wn:'#7A1F3D',pk:'#F49AC1',gd:'#2F5E2A',gr:'#4E9A3A',lm:'#9BD34B',td:'#1F4E5A',tq:'#3B8F86',bl:'#4A7FC1',sk:'#9FD4F0',pu:'#5A3E8C',li:'#A77BE0',gy:'#7D8A8C',lg:'#C9CFC9',nt:'#2B3A55'};
function shade(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;r=Math.round(r*k);g=Math.round(g*k);b=Math.round(b*k);return '#'+((1<<24)|(clamp(r,0,255)<<16)|(clamp(g,0,255)<<8)|clamp(b,0,255)).toString(16).slice(1);}
/* ---------- v10: o MEDALHÃO (reserva sem WebGL ou sem modelo 3D) ----------
   Nada de arte de fazenda: um medalhão de xilogravura na cor do reino, com o símbolo do reino (Sertão = chama,
   Mata = folha, Águas = gota com onda, Noite = lua, Arraial = fogueira), a marca do tipo (feitiço = estrela,
   construção = casinha) e o nome curto embaixo. Desenha em qualquer tamanho de canvas (g.canvas.width/height). */
function terrDeId(id){
  if(typeof CARD!=='undefined'&&CARD[id])return CARD[id].terreno||'neutro';
  if(id==='heroi-voce')return 'pasto';if(id==='mentora-zinha')return 'pomar';
  try{for(const k in RIVAIS){const R=RIVAIS[k];if(R.retrato===id){const n={};for(const l of R.lanes||[])n[l]=(n[l]||0)+1;return Object.keys(n).sort((a,b)=>n[b]-n[a])[0]||'neutro';}}}catch(e){}
  return 'neutro';
}
function nomeCurtoId(id){
  try{if(typeof CARD!=='undefined'&&CARD[id])return CARD[id].curto||CARD[id].nome;
    if(id==='heroi-voce')return 'Você';if(id==='mentora-zinha')return 'Vó Zinha';
    for(const k in RIVAIS){const R=RIVAIS[k];if(R.retrato===id)return (R.curto||R.nome||'').split(/[ ,]/)[0];}}catch(e){}
  return '';
}
/* símbolo do reino num quadrado de lado r*2 centrado em (x,y): traço de tinta e miolo creme */
function glifoReino(g,terr,x,y,r,tinta,miolo){
  g.save();g.translate(x,y);g.lineJoin='round';g.lineCap='round';g.lineWidth=Math.max(1.2,r*0.13);g.strokeStyle=tinta;g.fillStyle=miolo;
  g.beginPath();
  if(terr==='milharal'){g.moveTo(0,-r);g.bezierCurveTo(r*0.55,-r*0.35,r*0.85,r*0.1,r*0.55,r*0.6);g.bezierCurveTo(r*0.35,r*0.95,-r*0.35,r*0.95,-r*0.55,r*0.6);g.bezierCurveTo(-r*0.85,r*0.15,-r*0.4,-r*0.2,-r*0.15,-r*0.5);g.bezierCurveTo(-r*0.05,-r*0.2,r*0.1,-r*0.55,0,-r);g.closePath();g.fill();g.stroke();
    g.beginPath();g.moveTo(0,r*0.05);g.bezierCurveTo(r*0.3,r*0.3,r*0.25,r*0.65,0,r*0.7);g.bezierCurveTo(-r*0.25,r*0.65,-r*0.3,r*0.35,0,r*0.05);g.fillStyle=tinta;g.fill();}
  else if(terr==='pomar'){g.moveTo(0,-r);g.bezierCurveTo(r*0.9,-r*0.5,r*0.75,r*0.5,0,r*0.8);g.bezierCurveTo(-r*0.75,r*0.5,-r*0.9,-r*0.5,0,-r);g.closePath();g.fill();g.stroke();
    g.beginPath();g.moveTo(0,-r*0.75);g.lineTo(0,r);for(const k of [-0.4,-0.05,0.3]){g.moveTo(0,r*k);g.lineTo(r*0.4,r*(k-0.3));g.moveTo(0,r*k);g.lineTo(-r*0.4,r*(k-0.3));}g.stroke();}
  else if(terr==='brejo'){g.moveTo(0,-r);g.bezierCurveTo(r*0.4,-r*0.4,r*0.7,0,r*0.7,r*0.3);g.arc(0,r*0.3,r*0.7,0,Math.PI);g.bezierCurveTo(-r*0.7,0,-r*0.4,-r*0.4,0,-r);g.closePath();g.fill();g.stroke();
    g.beginPath();g.moveTo(-r*0.45,r*0.35);g.quadraticCurveTo(-r*0.22,r*0.12,0,r*0.35);g.quadraticCurveTo(r*0.22,r*0.58,r*0.45,r*0.35);g.stroke();}
  else if(terr==='pasto'){g.arc(0,0,r*0.9,Math.PI*0.3,Math.PI*1.7);g.bezierCurveTo(-r*0.2,-r*0.55,-r*0.2,r*0.55,r*0.53,r*0.73);g.closePath();g.fill();g.stroke();
    for(const [sx,sy,sr] of [[0.55,-0.5,0.16],[0.75,0.05,0.1]]){g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?sr*0.35:sr;g.lineTo(r*sx+Math.cos(a)*r*rr,r*sy+Math.sin(a)*r*rr);}g.closePath();g.fillStyle=miolo;g.fill();}}
  else{for(const s of [-1,1]){g.moveTo(s*r*0.8,r*0.85);g.lineTo(-s*r*0.6,r*0.45);}g.stroke();g.beginPath();g.moveTo(0,-r);g.bezierCurveTo(r*0.6,-r*0.3,r*0.6,r*0.35,0,r*0.55);g.bezierCurveTo(-r*0.6,r*0.35,-r*0.5,-r*0.2,-r*0.15,-r*0.45);g.bezierCurveTo(-r*0.1,-r*0.2,r*0.05,-r*0.55,0,-r);g.closePath();g.fill();g.stroke();}
  g.restore();
}
function medalhaoPintar(g,id,o){
  o=o||{};const W=g.canvas.width,H=g.canvas.height,m=Math.min(W,H);
  const terr=terrDeId(id),cor=(typeof TERR_COR!=='undefined'&&TERR_COR[terr])||'#B08A5A',c=(typeof CARD!=='undefined'&&CARD[id])||null;
  const tinta='#1E120C',creme='#F3E7CD',dark=!!o.dark;
  g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.imageSmoothingEnabled=true;g.clearRect(0,0,W,H);
  // fundo: o reino no escuro, com raios de xilogravura
  let gr=g.createRadialGradient(W/2,H*0.45,0,W/2,H*0.45,Math.max(W,H)*0.75);gr.addColorStop(0,dark?'#2E2620':shade(cor,0.62));gr.addColorStop(1,dark?'#120E0C':shade(cor,0.22));g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.save();g.translate(W/2,H*0.46);g.fillStyle=dark?'rgba(255,240,200,.03)':'rgba(255,236,190,.09)';for(let i=0;i<16;i++){const a=i/16*6.283;g.beginPath();g.moveTo(0,0);g.arc(0,0,Math.max(W,H),a,a+0.17);g.closePath();g.fill();}g.restore();
  const nome=o.semNome?'':nomeCurtoId(id),temNome=!!nome&&H>=60;
  const R=m*(temNome?0.36:0.44),cx=W/2,cy=temNome?H*0.42:H/2;
  // aro dentado (xilogravura) e disco
  g.fillStyle=tinta;g.beginPath();for(let i=0;i<48;i++){const a=i/48*6.283,rr=R*(i%2?1.0:1.07);g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}g.closePath();g.fill();
  gr=g.createRadialGradient(cx-R*0.3,cy-R*0.35,R*0.1,cx,cy,R);gr.addColorStop(0,dark?'#3A322A':shade(cor,1.25));gr.addColorStop(1,dark?'#1E1814':shade(cor,0.8));
  g.fillStyle=gr;g.beginPath();g.arc(cx,cy,R*0.9,0,6.283);g.fill();
  g.strokeStyle=dark?'#5A4E40':creme;g.lineWidth=Math.max(1,R*0.05);g.beginPath();g.arc(cx,cy,R*0.8,0,6.283);g.stroke();
  // riscos de goiva por dentro (marca da madeira)
  g.strokeStyle='rgba(30,18,12,.28)';g.lineWidth=Math.max(0.8,R*0.025);for(let i=0;i<9;i++){const y=cy-R*0.6+i*R*0.15,w=Math.sqrt(Math.max(0,R*R*0.5-(y-cy)*(y-cy)));g.beginPath();g.moveTo(cx-w*0.9,y);g.lineTo(cx-w*0.5,y+R*0.02);g.moveTo(cx+w*0.45,y);g.lineTo(cx+w*0.9,y-R*0.02);g.stroke();}
  if(!dark){glifoReino(g,terr,cx,cy-R*0.04,R*0.5,tinta,creme);
    if(c&&c.tipo==='feitico'){g.save();g.translate(cx+R*0.55,cy-R*0.55);g.fillStyle=creme;g.strokeStyle=tinta;g.lineWidth=Math.max(1,R*0.05);g.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rr=i%2?R*0.08:R*0.24;g.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}g.closePath();g.fill();g.stroke();g.restore();}
    else if(c&&c.tipo==='construcao'){g.save();g.translate(cx+R*0.55,cy-R*0.55);const k=R*0.2;g.fillStyle=creme;g.strokeStyle=tinta;g.lineWidth=Math.max(1,R*0.05);g.beginPath();g.moveTo(-k,k);g.lineTo(-k,-k*0.1);g.lineTo(0,-k);g.lineTo(k,-k*0.1);g.lineTo(k,k);g.closePath();g.fill();g.stroke();g.restore();}}
  else{g.fillStyle='rgba(243,231,205,.35)';g.font=`700 ${Math.round(R*0.9)}px ${'Rye, Fredoka, serif'}`;g.textAlign='center';g.textBaseline='middle';g.fillText('?',cx,cy+R*0.04);}
  if(temNome&&!dark){const fs=Math.max(8,Math.round(Math.min(H*0.13,W*0.95/Math.max(4,nome.length)*1.6)));g.font=`${fs}px Rye, Fredoka, Georgia, serif`;g.textAlign='center';g.textBaseline='alphabetic';
    const y=H-Math.max(3,H*0.06);g.lineWidth=Math.max(2,fs*0.28);g.strokeStyle=tinta;g.strokeText(nome,W/2,y,W*0.94);g.fillStyle=creme;g.fillText(nome,W/2,y,W*0.94);}
  // vinheta
  gr=g.createRadialGradient(W/2,H/2,m*0.35,W/2,H/2,Math.max(W,H)*0.75);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(0,0,W,H);
  g.restore();
}
function placeholder(g,id,dark){medalhaoPintar(g,id,{dark});}
function drawArt(g,id,t){medalhaoPintar(g,id,{});return false;}
const RETRATO_FALLBACK={};
/* canvas: <canvas class="art" width=64 height=48 data-art=id [data-anim] [data-dark]> */
const artLive=new Set();const artVis=new Set();
let artIO=null;
try{artIO=new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting)artVis.add(e.target);else artVis.delete(e.target);}},{rootMargin:'40px'});}catch(e){}
let _off=null;
function offCanvas(){if(!_off){_off=document.createElement('canvas');_off.width=64;_off.height=48;}return _off;}
/* v10: o medalhão é desenhado liso em 3x (o tamanho na tela não muda: o CSS fixa a largura e a altura) */
function paintCanvas(cv,t){
  const k=3,w=(cv.dataset.crop?40:64)*k,h=(cv.dataset.crop?40:48)*k;
  if(cv.width!==w)cv.width=w;if(cv.height!==h)cv.height=h;cv.classList.add('a3d');
  const g=cv.getContext('2d');if(!g)return;
  medalhaoPintar(g,cv.dataset.art,{dark:!!cv.dataset.dark,semNome:!!cv.dataset.crop});
}
function hydrate(root){
  const list=(root||document).querySelectorAll('canvas[data-art]:not([data-p])');
  const tres=[];
  for(const cv of list){
    cv.dataset.p='1';
    // v9: retrato 3D quando há modelo e WebGL (37-retrato3d.js); senão a arte em pixel
    if(typeof R3D!=='undefined'&&R3D.quer(cv)){tres.push(cv);continue;}
    artPixel(cv);
  }
  if(tres.length)R3D.pedir(tres);
}
function artPixel(cv){
  paintCanvas(cv,0); // v10: o medalhão é parado (nada de laço)
}
function artLoop(){
  if(RM||document.hidden)return;
  const t=artT();let n=0;
  for(const cv of artLive){
    if(!cv.isConnected){artLive.delete(cv);artVis.delete(cv);if(artIO)artIO.unobserve(cv);continue;}
    if(!artVis.has(cv))continue;
    if(n>=16)break;
    paintCanvas(cv,t);n++;
  }
}
setInterval(artLoop,125);
function artCanvas(id,o){
  o=o||{};
  const w=o.crop?40:64,h=o.crop?40:48;
  return `<canvas class="art${o.cls?' '+o.cls:''}" width="${w}" height="${h}" data-art="${id}"${o.anim?' data-anim="1"':''}${o.dark?' data-dark="1"':''}${o.crop?' data-crop="1"':''} aria-hidden="true"></canvas>`;
}
function retratoId(rivalKey){
  if(rivalKey==='voce')return 'heroi-voce';if(rivalKey==='zinha')return 'mentora-zinha';
  return RIVAIS[rivalKey].retrato;
}

/* ---------- texto das cartas ---------- */
function nDe(id,lvl){const c=CARD[id];return c.n?c.n[(lvl||1)-1]:null;}
function textoCarta(id,lvl,html){
  const c=CARD[id];let t=c.texto||'';
  if(c.n)t=t.replace('{n}',nDe(id,lvl));
  if(!html)return t;
  t=escH(t);
  return t.replace(NEGRITO_RE,'<b>$1</b>');
}
function statsBase(id,lvl){const c=CARD[id],b=LVL_BONUS[(lvl||1)-1];return {atk:c.atk+b[0],hp:c.hp+b[1]};}
function kwIcons(kw,px,extra,fam){
  let h='';const fk=fam&&fam.kw||{};
  for(const k of KW_ORDEM){if(!kw[k])continue;const df=fk[k]>0;
    h+=`<span class="kw${df?' kwf':''}" title="${escH(KW_INFO[k].nome)}${df?' (família)':''}"${df?` style="--fc:${fam.cor}"`:''}>${ic(k,px)}${KW_NUM[k]?`<i class="num">${kw[k]}</i>`:''}</span>`;}
  if(extra)h+=`<span class="kw" title="Habilidade">${ic('habilidade',px)}</span>`;
  return h;
}
const temHabilidadeExtra=id=>CARD[id].fx.length>0;

/* ---------- carta (DOM) ----------
 sz: mini | hand | thumb | rv | big
 o: {lvl, inst (criatura em campo), anim, unknown, cls, tag, attrs} */
function cardHTML(id,o){
  o=o||{};
  const c=CARD[id],sz=o.sz||'hand',lvl=o.lvl||1,inst=o.inst;
  const unknown=!!o.unknown;
  const cls=['card','r-'+(unknown?'comum':c.rar),'sz-'+sz,'tp-'+c.tipo];
  if(o.anim)cls.push('anim');if(o.cls)cls.push(o.cls);if(unknown)cls.push('unk');
  const dc=cardDeco(id,o);if(dc.cls)cls.push(dc.cls.trim());
  let atkH='',hpH='';
  if(c.tipo==='criatura'&&!unknown){
    const b=statsBase(id,lvl);
    let atk=b.atk,hp=b.hp,ac='',hc='';
    if(inst){atk=effAtk(inst);hp=Math.max(0,inst.hp);if(atk>b.atk)ac='up';else if(atk<b.atk)ac='down';if(inst.hp<inst.maxHp)hc='dmg';else if(inst.hp>b.hp)hc='up';}
    atkH=`<span class="st atk ${ac}">${ic('espada',sz==='big'?14:10)}<b class="num">${atk}</b></span>`;
    hpH=`<span class="st hp ${hc}">${ic('coracao',sz==='big'?14:10)}<b class="num">${hp}</b></span>`;
  }
  const art=artCanvas(id,{anim:o.anim&&!unknown,dark:unknown});
  const kw=inst?inst.kw:c.kw;
  const tag=o.tag||'div';
  const hand=sz==='hand';
  const cost=(sz!=='mini'&&!c.ficha&&!unknown)?`<span class="cost num" aria-label="custo ${c.custo}">${c.custo}</span>`:'';
  const famK=inst&&o.fam&&inst.fb&&inst.fb.kw?{kw:inst.fb.kw,cor:FAMILIAS[o.fam.f].cor}:null;
  const kwsH=(sz!=='big'&&!unknown)?`<div class="kws">${kwIcons(kw,sz==='mini'?12:11,temHabilidadeExtra(id),famK)}</div>`:'';
  // v4: selo da família (no campo só enquanto o bônus vale; nas outras cartas sempre, pequeno no rodapé)
  const F=c.familia&&!unknown?FAMILIAS[c.familia]:null;
  const famcH=(sz==='mini'&&o.fam&&F)?`<span class="famc${o.fam.niv>=2?' n2':''}" style="--fc:${F.cor}" title="Família ${escH(F.nome)}: ${escH(F.txt[o.fam.niv-1])}">${ic(F.ic,10)}${o.fam.niv>=2?'<i>+</i>':''}</span>`:'';
  const raizH=(inst&&inst.raiz)?`<span class="raizb" title="Enraizada: não ataca no próximo combate">${ic('raiz',12)}</span>`:'';
  let h=`<${tag} class="${cls.join(' ')}" data-id="${id}"${o.attrs||''}><div class="cf t-${c.terreno}">`;
  // carta da mão: nome com a largura toda (2 linhas); custo e palavras-chave por cima da arte
  if(!hand)h+=cost;
  // no campo, nome com palavra muito comprida (Galo Despertador, Formiga Carregadeira) usa o nome curto
  const nomeV=(sz==='mini'&&c.curto&&c.nome.split(/\s/).some(w=>w.length>10))?c.curto:c.nome;
  h+=`<span class="cn">${escH(nomeV)}</span>`; // nas cartas do campo o nome só aparece quando há espaço (CSS)
  const kwIn=hand||sz==='mini'; // no campo as palavras-chave ficam por cima da arte
  h+=`<div class="aw">${art}${unknown?'<span class="q">?</span>':''}${hand?cost:''}${kwIn?kwsH:''}${inst&&inst.rest?'<span class="zz" aria-hidden="true"><i>z</i><i>Z</i><i>z</i></span>':''}${o.affc?`<span class="affc" style="border-color:${TERR_COR[o.affc]}" title="+1/+1 no terreno da mesma cor">${terrIc(o.affc,10)}</span>`:''}${famcH}${raizH}${(F&&(sz==='hand'||sz==='thumb'||sz==='rv'))?`<span class="fic" style="--fc:${F.cor}" title="Família ${escH(F.nome)}">${ic(F.ic,10)}</span>`:''}${c.v4&&o.novo?'<span class="novo4">NOVO</span>':''}</div>`;
  if(sz==='big'||sz==='rv')h+=`<div class="tl">${terrIc(c.terreno,10)}<span>${TIPO_NOME[c.tipo]}${' · '+TERR_NOME[c.terreno]}</span>${F?`<span class="tfam" style="--fc:${F.cor}">${ic(F.ic,10)}${escH(F.nome)}</span>`:''}</div>`;
  if(!kwIn)h+=kwsH;
  if((sz==='big'||sz==='rv')&&!unknown)h+=`<div class="tx">${textoCarta(id,lvl,true)||'<i>Sem habilidade.</i>'}</div>`;
  if(sz==='big'&&!unknown)h+=`<div class="fl">“${escH(c.sabor)}”</div>`;
  // nível no rodapé, ao lado da gema: nunca cobre o nome
  const lv=(lvl>1&&!unknown&&sz!=='mini')?`<span class="lv num">Nv${lvl}</span>`:'';
  h+=`<div class="ft">${atkH||'<span class="st"></span>'}<span class="gm">${gemIc(unknown?'comum':c.rar,sz==='big'?14:10)}${lv}</span>${hpH||'<span class="st"></span>'}</div>`;
  if(c.rar==='lendaria'&&!unknown)h+='<i class="spk s1"></i><i class="spk s2"></i><i class="spk s3"></i>';
  h+=dc.html;
  h+=`</div>${sz==='mini'?'<i class="ped" aria-hidden="true"></i>':''}</${tag}>`;
  return h;
}
const SEAL_V='<circle cx="24" cy="24" r="21" fill="#E8A93A" stroke="#2E1F05" stroke-width="2.6"/><circle cx="22.5" cy="22" r="18" fill="#F6C650"/><circle cx="24" cy="24" r="15.5" fill="none" stroke="#B9801C" stroke-width="1.8" stroke-dasharray="3 2.4"/><path d="M24 12c3.4 0 5 4.6 5 9.6S27.4 33 24 33s-5-6.4-5-11.4S20.6 12 24 12z" fill="#FFE58A" stroke="#2E1F05" stroke-width="2"/><path d="M21.6 18h4.8M21.2 22h5.6M21.6 26h4.8" stroke="#B9801C" stroke-width="1.5" stroke-linecap="round"/><path d="M24 38c-6-1.4-8.6-6.4-8-12.4 2.8 2.6 4.8 5.6 8 9.6 3.2-4 5.2-7 8-9.6.6 6-2 11-8 12.4z" fill="#6CB843" stroke="#2E1F05" stroke-width="2" stroke-linejoin="round"/><path d="M13 15a12 12 0 0 1 7-5.4" fill="none" stroke="#FFF6D0" stroke-width="2.2" stroke-linecap="round"/>';
/* ---------- v10 (Agente 6): molduras de carta (xilogravura da Ascensão + Mascate) e versos ----------
   O CSS vai injetado daqui (style.css é do Agente 1). Só as cartas do jogador ganham Ascensão/moldura:
   cardHTML sem inst (mão, coleção, loja, revelação). Nada muda tamanho de carta: tudo é sobreposição. */
const MOLD_COR={brasa:'#E8862E',musgo:'#3FA34D',correnteza:'#2E9FB5',luar:'#9C7FF0',bandeirinha:'#E8693A',lamparina:'#FFB23D'};
function cardDeco(id,o){
  const r={cls:'',html:''};
  try{
    if(o.unknown||o.inst||o.semDeco||typeof s==='undefined'||!s||!s.cards)return r;
    const sc=s.cards[id];const t=Math.max(0,Math.min(3,(typeof ascVisivel==='function'?ascVisivel(id):(sc&&!sc.ascOff?sc.asc:0))|0));
    if(t){const gl=(typeof TEMA!=='undefined'&&TEMA.asc&&TEMA.asc.glifo&&TEMA.asc.glifo[t-1])||['☾','☾☾','✦'][t-1];
      r.cls+=' asc asc'+t;r.html+=`<i class="xb" aria-hidden="true"></i><i class="xg" aria-hidden="true">${gl}</i>`;}
    const m=s.cosm&&s.cosm.usa&&s.cosm.usa.moldura;
    if(m&&typeof m==='string'&&m.startsWith('mold-')){
      let k=m.slice(5),cor=MOLD_COR[k];
      if(k.startsWith('cordel-')){cor=TERR_COR[k.slice(7)]||'#E9DDC2';k='cordel';}
      if(cor){r.cls+=' mo mo-'+k;r.html+=`<i class="moc" style="--mo:${cor}" aria-hidden="true"></i>`;}
    }
  }catch(e){}
  return r;
}
/* versos: fundo em <pattern> SVG + medalhão com a lua e o nome do jogo */
let _vsN=0;
const VERSOS={
  padrao:{bg:'#18241A',bd:'#C9A35A',ink:'#F2D99A',p:(c)=>`<path d="M0 10Q5 0 10 10T20 10" fill="none" stroke="#24382A" stroke-width="2"/>`,ps:20},
  cordel:{bg:'#E9DDC2',bd:'#2A1E14',ink:'#2A1E14',p:()=>`<path d="M0 4h14M0 11h9" stroke="#CDBE9C" stroke-width="1.2"/>`,ps:14},
  couro:{bg:'#7A4C2A',bd:'#E0B07A',ink:'#F4D8A8',p:()=>`<path d="M8 1l7 7-7 7-7-7z" fill="none" stroke="#5E361C" stroke-width="1.4"/><circle cx="8" cy="8" r="1.4" fill="#A06A3E"/>`,ps:16,cost:1},
  renda:{bg:'#2E2A36',bd:'#EFE6D4',ink:'#EFE6D4',p:()=>`<circle cx="9" cy="9" r="6" fill="none" stroke="#EFE6D4" stroke-width="1" opacity=".55"/><circle cx="9" cy="9" r="2.2" fill="#EFE6D4" opacity=".55"/><circle cx="0" cy="0" r="2" fill="#EFE6D4" opacity=".4"/><circle cx="18" cy="18" r="2" fill="#EFE6D4" opacity=".4"/>`,ps:18},
  chita:{bg:'#C83A30',bd:'#F2C230',ink:'#FFF3D0',p:()=>`<g transform="translate(12 12)"><circle r="6" fill="#F2C230"/><circle r="3.4" fill="#2E8FD0"/><circle r="1.3" fill="#FFF3D0"/></g><path d="M22 2q4 3 0 7q-4-3 0-7z" fill="#3FA34D"/><circle cx="3" cy="20" r="2.4" fill="#FFF3D0"/>`,ps:24},
  palha:{bg:'#C9A35A',bd:'#6B4630',ink:'#3A2414',p:()=>`<path d="M0 0h6v6H0zM6 6h6v6H6z" fill="#B48A44"/><path d="M0 3h6M9 6v6" stroke="#E0C07A" stroke-width="1"/>`,ps:12},
  'ceu-junho':{bg:'#1E2A5E',bd:'#F2C230',ink:'#FFF3D0',p:()=>`<circle cx="4" cy="5" r=".9" fill="#FFF3D0"/><circle cx="15" cy="12" r=".6" fill="#FFF3D0"/><circle cx="9" cy="17" r=".5" fill="#C8D0FF"/><path d="M17 2l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#F2C230"/>`,ps:20,bandeiras:1},
  gibao:{bg:'#8A5A32',bd:'#3A2414',ink:'#F4D8A8',p:()=>`<path d="M0 14A10 10 0 0 1 20 14" fill="none" stroke="#6A4022" stroke-width="2"/><path d="M4 14A6 6 0 0 1 16 14" fill="none" stroke="#B07A48" stroke-width="1.2"/>`,ps:20,cost:1},
  bananeira:{bg:'#2E6A2A',bd:'#A8D878',ink:'#E8F8C8',p:()=>`<path d="M0 0L16 16M8 0L16 8M0 8L8 16" stroke="#3E8A38" stroke-width="1.4"/>`,ps:16},
  escama:{bg:'#1E5A6A',bd:'#A8F0FF',ink:'#D8F8FF',p:()=>`<path d="M0 8A6 6 0 0 1 12 8M-6 14A6 6 0 0 1 6 14M6 14A6 6 0 0 1 18 14" fill="none" stroke="#5EC8D8" stroke-width="1.2" opacity=".8"/>`,ps:12},
  lencol:{bg:'#C9C4E0',bd:'#5A4E86',ink:'#3A3060',p:()=>`<path d="M0 6Q10 0 20 6T40 6" fill="none" stroke="#B0A8D0" stroke-width="2.4"/>`,ps:20},
  xilo:{bg:'#ECE2CA',bd:'#1A1420',ink:'#1A1420',p:()=>`<path d="M0 3l3-3M0 9l9-9M4 12l8-8" stroke="#1A1420" stroke-width=".7" opacity=".35"/>`,ps:12}
};
function cardBackHTML(cls){
  let k='padrao';
  try{const v=s&&s.cosm&&s.cosm.usa&&s.cosm.usa.verso;if(v&&typeof v==='string'){const q=v.replace(/^verso-/,'');if(VERSOS[q])k=q;}}catch(e){}
  const V=VERSOS[k],n='vs'+(++_vsN),pat=V.p();
  const nome=(typeof jogoNome==='function'?jogoNome():((typeof TEMA!=='undefined'&&TEMA.jogo&&TEMA.jogo.nome)||'Mata Adentro'));
  const pal=String(nome).toUpperCase().split(/\s+/);
  const band=V.bandeiras?`<path d="M6 30Q50 44 94 30" fill="none" stroke="#FFF3D0" stroke-width=".8"/>${[14,26,38,50,62,74,86].map((x,i)=>{const y=30+Math.sin((x-6)/88*Math.PI)*7;return `<path d="M${x-4} ${y}h8l-4 7z" fill="${['#E8693A','#F2C230','#3FA34D','#4FB3E8','#B36BE8'][i%5]}"/>`;}).join('')}`:'';
  const costura=V.cost?`<rect x="8" y="8" width="84" height="124" rx="6" fill="none" stroke="${V.bd}" stroke-width="1.1" stroke-dasharray="3 2.4"/>`:'';
  return `<div class="cback vs-${k} ${cls||''}"><svg class="vsv" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs><pattern id="${n}" width="${V.ps}" height="${V.ps}" patternUnits="userSpaceOnUse">${pat}</pattern><radialGradient id="${n}g"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".22"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient></defs>
<rect width="100" height="140" fill="${V.bg}"/><rect width="100" height="140" fill="url(#${n})"/>${band}${costura}
<rect x="4" y="4" width="92" height="132" rx="7" fill="none" stroke="${V.bd}" stroke-width="2.4"/>
<circle cx="50" cy="62" r="34" fill="url(#${n}g)"/>
<circle cx="50" cy="62" r="23" fill="${V.bg}" stroke="${V.bd}" stroke-width="2.6"/><circle cx="50" cy="62" r="19" fill="none" stroke="${V.bd}" stroke-width="1" stroke-dasharray="2 2"/>
<path d="M54 46a16 16 0 1 0 9 27.5A12.6 12.6 0 0 1 54 46z" fill="${V.ink}"/>
<path d="M36 76l4-7 3 4 3-9 4 12 3-6 3 6" fill="none" stroke="${V.bd}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
<text x="50" y="103" text-anchor="middle" font-family="Rye,Georgia,serif" font-size="${pal[0].length>5?11:12.5}" fill="${V.ink}" stroke="${V.bg}" stroke-width=".6" paint-order="stroke">${escH(pal[0]||'')}</text>
<text x="50" y="117" text-anchor="middle" font-family="Rye,Georgia,serif" font-size="${(pal[1]||'').length>7?9.5:11}" fill="${V.ink}" stroke="${V.bg}" stroke-width=".6" paint-order="stroke">${escH(pal.slice(1).join(' '))}</text>
</svg></div>`;
}
(function v10DecoCSS(){
  if(typeof document==='undefined'||document.getElementById('v10deco'))return;
  const st=document.createElement('style');st.id='v10deco';
  const borda=(a,b)=>`repeating-linear-gradient(45deg,${a} 0 2px,${b} 2px 3px)`;
  st.textContent=`
.cback{background:#18241A;border:0;padding:0}
.cback .vsv{position:absolute;inset:0;width:100%;height:100%;display:block}
.card .xb,.card .moc{position:absolute;inset:0;z-index:2;pointer-events:none;border-radius:6px}
.card .xb{padding:4px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
.card.asc1 .xb{background:${borda('#C07A3A','#4A2810')}}
.card.asc2 .xb{background:${borda('#E4E8EE','#5A6070')};padding:4px}
.card.asc3 .xb{background:${borda('#FFD86A','#7A4E0A')};padding:4px}
.card.asc2 .xb::before,.card.asc2 .xb::after,.card.asc3 .xb::before,.card.asc3 .xb::after{content:'';position:absolute;width:7px;height:7px;background:#F4F6FA;border:1px solid #2A2230;transform:rotate(45deg);top:-2px;left:-2px}
.card.asc2 .xb::after,.card.asc3 .xb::after{left:auto;right:-2px}
.card.asc3 .xb::before,.card.asc3 .xb::after{background:#FFE58A;border-radius:1px}
.card.asc3{box-shadow:0 0 8px rgba(255,216,106,.7)}
.card .xg{position:absolute;z-index:4;pointer-events:none;top:52%;right:3px;min-width:15px;height:15px;padding:0 3px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  font:700 10px/1 Georgia,serif;font-style:normal;color:#2A1A08;border:1.5px solid #1A1420;background:#C07A3A}
.card.asc2 .xg{background:#E4E8EE}.card.asc3 .xg{background:#FFD86A;box-shadow:0 0 6px #FFD86A}
.sz-big .xg{top:auto;bottom:34%;right:6px;min-width:20px;height:20px;font-size:13px;border-radius:10px}
.lane .card .xb,.lane .card .xg,.lane .card .moc{display:none}
.card .moc{box-shadow:inset 0 0 0 2px var(--mo),inset 0 0 8px color-mix(in srgb,var(--mo) 55%,transparent)}
.card.asc .moc{inset:3px}
.card.mo-brasa .moc{background:radial-gradient(circle at 15% 100%,rgba(255,154,48,.55) 0 2px,transparent 3px),radial-gradient(circle at 80% 98%,rgba(255,200,64,.6) 0 1.5px,transparent 2.5px),radial-gradient(circle at 50% 100%,rgba(232,134,46,.3),transparent 30%)}
.card.mo-musgo .moc{background:radial-gradient(ellipse 9px 5px at 0 0,var(--mo) 60%,transparent 64%),radial-gradient(ellipse 9px 5px at 100% 100%,var(--mo) 60%,transparent 64%),radial-gradient(ellipse 5px 9px at 100% 0,#7FCB5A 60%,transparent 64%),radial-gradient(ellipse 5px 9px at 0 100%,#7FCB5A 60%,transparent 64%)}
.card.mo-correnteza .moc{background:radial-gradient(circle at 50% 0,transparent 4px,var(--mo) 4.5px 5.5px,transparent 6px) 0 100%/10px 7px repeat-x}
.card.mo-luar .moc{background:radial-gradient(circle at 85% 6%,var(--mo) 0 4px,transparent 4.5px) ,radial-gradient(circle at 88% 8%,#F4E3B5 0 5px,transparent 5.5px),linear-gradient(180deg,rgba(156,127,240,.25),transparent 25%)}
.card.mo-bandeirinha .moc{background:linear-gradient(135deg,#E8693A 25%,transparent 25%) 0 0/8px 6px repeat-x,linear-gradient(225deg,#F2C230 25%,transparent 25%) 4px 0/8px 6px repeat-x}
.card.mo-lamparina .moc{box-shadow:inset 0 0 0 2px var(--mo),inset 0 0 12px rgba(255,178,61,.75)}
.card.mo-lamparina.anim .moc,.card.mo-lamparina:hover .moc{animation:v10lamp 1.3s ease-in-out infinite}
@keyframes v10lamp{0%,100%{box-shadow:inset 0 0 0 2px var(--mo),inset 0 0 10px rgba(255,178,61,.6)}40%{box-shadow:inset 0 0 0 2px #FFD27A,inset 0 0 16px rgba(255,200,90,.95)}70%{box-shadow:inset 0 0 0 2px var(--mo),inset 0 0 8px rgba(255,140,40,.55)}}
.card.mo-cordel .moc{box-shadow:inset 0 0 0 2px var(--mo);background:repeating-linear-gradient(90deg,#E9DDC2 0 3px,transparent 3px 5px) 0 4px/100% 1.5px no-repeat,repeating-linear-gradient(90deg,#E9DDC2 0 3px,transparent 3px 5px) 0 calc(100% - 4px)/100% 1.5px no-repeat}
@media (prefers-reduced-motion:reduce){.card.mo-lamparina .moc{animation:none!important}}
`;
  (document.head||document.documentElement).appendChild(st);
})();
let _seal='';
function sealRects(){
  if(_seal)return _seal;
  const rows=['.....kkkkkk.....','...kkyyyyyykk...','..kyyYYyyyyyok..','.kyYyyykkyyyyok.','.kyYyykyykyyyok.','kyYyyyykkyyyyyok','kyyyykyykyykyyok','kyyyyykkykkyyyok','kyyyykyykyykyyok','kyyyyykkykkyyyok','kyyyyyyykyyyyyok','.kyyyyyykyyyyok.','.kyyyyyykyyyyok.','..koyyyyyyyook..','...kkoooooookk..','.....kkkkkk.....'];
  const col={k:'#2E1F05',y:'#F2BE4A',Y:'#FFE58A',o:'#B9801C'};
  for(let y=0;y<16;y++){const row=rows[y];let x=0;while(x<row.length){const ch=row[x];if(ch==='.'){x++;continue;}let x2=x+1;while(x2<row.length&&row[x2]===ch)x2++;_seal+=`<rect x="${x}" y="${y}" width="${x2-x}" height="1" fill="${col[ch]}"/>`;x=x2;}}
  return _seal;
}

/* ---------- cenas (banners de arena e fundo) ---------- */
function paintScene(cv,arena){
  const W=cv.width,H=cv.height,g=cv.getContext('2d');if(!g)return;
  const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0);};
  const hsh=(x,y)=>((x*73856093)^(y*19349663))>>>0;
  const P=PAL;const hz=12;
  const sempre=()=>true;
  function milharal(x0,x1,dusk,semCeu,okX){
    okX=okX||sempre;
    if(!semCeu){R(dusk?P.pu:P.sk,x0,0,x1-x0,7);R(dusk?P.nt:P.cr,x0,7,x1-x0,hz-7);if(dusk){R(P.or,x0,hz-2,x1-x0,2);}}
    for(let x=x0;x<x1;x++){if(!okX(x))continue;const m=x%3;R(dusk?(m===1?P.gd:P.ol):(m===1?P.gr:P.gd),x,hz-3,1,13+((hsh(x,1)%3)));if(x%6===0)R(dusk?P.wd:P.yl,x,hz-4,1,2);
      R(dusk?P.sd:P.wo,x,22,1,H-22);R(dusk?P.ol:P.wd,x,24,1,1);R(dusk?P.ol:P.wd,x,27,1,1);}
  }
  function nuvens(x0,x1,storm){for(let k=0;k<2;k++){const cx=x0+((hsh(k,x0)%Math.max(1,x1-x0-14))|0),cy=2+k*3;R(storm?P.nt:P.wh,cx,cy,10,2);R(storm?P.ol:P.lg,cx+1,cy+2,8,1);}}
  function pasto(x0,x1,storm,semCeu,okX){
    okX=okX||sempre;
    // o céu desce até abaixo do ponto mais baixo do morro (senão sobra faixa transparente)
    if(!semCeu){R(storm?P.nt:P.bl,x0,0,x1-x0,4);R(storm?P.gy:P.sk,x0,4,x1-x0,hz+3-4);nuvens(x0,x1,storm);}
    for(let x=x0;x<x1;x++){if(!okX(x))continue;const top=hz+Math.round(2*Math.sin(x/8));R(storm?P.gd:P.gr,x,top,1,H-top);R(storm?P.gr:P.lm,x,top,1,1);
      R(P.wd,x,hz+4,1,1);R(P.wd,x,hz+6,1,1);if((x-x0)%9===3)R(P.wo,x,hz+3,1,5);}
  }
  if(arena===1){
    // um céu só para o banner inteiro; milharal e pasto se misturam no meio (sem emenda reta)
    const mid=W>>1,f=8;
    R(P.bl,0,0,W,3);R(P.sk,0,3,W,5);R(P.cr,0,8,W,hz+3-8);nuvens(mid-10,W,false);
    const ehPasto=x=>x>=mid+f?true:x<mid-f?false:(hsh(x,21)%(2*f))<(x-(mid-f));
    pasto(0,W,false,true,ehPasto);
    milharal(0,W,false,true,x=>!ehPasto(x));
  }
  else if(arena===2){
    R(P.pk,0,0,W,6);R(P.cr,0,6,W,hz-6);
    for(let x=0;x<W;x+=11){const cx=x+((hsh(x,2)%5)|0);R(P.gd,cx-4,0,10,8);R(P.gd,cx-5,2,12,5);R(P.gr,cx-3,1,4,2);if(hsh(x,3)%2)R(P.rd,cx+1,4,2,2);R(P.pk,cx-2,6,1,1);}
    R(P.gd,0,hz,W,10);for(let x=0;x<W;x+=2)R(P.gr,x+((hz)%2),hz,1,1);
    for(let x=4;x<W;x+=23)R(P.wd,x,4,2,18);
    R(P.gr,0,22,W,H-22);for(let x=0;x<W;x+=5)R(P.lm,x,23+((hsh(x,4)%4)|0),1,2);
  }else if(arena===3){
    R(P.td,0,0,W,8);for(let y=8;y<hz;y++)for(let x=(y%2);x<W;x+=2)R(P.tq,x,y,1,1);
    R(P.gd,0,hz,W,7);for(let x=0;x<W;x++){const top=hz-4+((hsh(x,5)%6)|0);if(x%2===0)R(P.gr,x,top,1,hz+7-top);if(hsh(x,6)%9===0)R(P.wo,x,top-1,1,2);}
    R(P.td,0,hz+7,W,H-hz-7);for(let k=0;k<W/6;k++){const x=(hsh(k,7)%W)|0,y=hz+8+((hsh(k,8)%(H-hz-9))|0);R(P.tq,x,y,3+((hsh(k,9)%3)|0),1);}
    for(let k=0;k<W/20;k++)R(P.lm,(hsh(k,10)%W)|0,2+((hsh(k,11)%8)|0),1,1);
    for(let y=hz-1;y<hz+2;y++)for(let x=(y%2);x<W;x+=2)if(hsh(x,y)%3===0)R(P.lg,x,y,1,1);
  }else if(arena===4){
    pasto(0,W,true);
    const sx=Math.round(W*0.68);R(P.gy,sx,1,10,hz+6);R(P.lg,sx,1,3,hz+6);R(P.ol,sx-1,0,12,1);R(P.sd,sx+2,hz,4,6);for(let y=4;y<hz+5;y+=3)R(P.ol,sx,y,10,1);R(P.gy,sx+1,-1,8,2);
  }else{
    milharal(0,W,true);
    for(let x=4;x<W;x+=13){const y=3+((hsh(x,12)%3)|0);R(P.ol,x,0,1,y);R(P.yl,x-1,y,2,2);}
  }
}

/* ---------- v9: banner da arena liso (degradês e formas redondas, estilo desenho animado; nada de pixel) ---------- */
function paintSceneLisa(cv,arena){
  const r=cv.getBoundingClientRect();const pr=Math.min(window.devicePixelRatio||1,2);
  const W=Math.max(120,Math.round((r.width||cv.width*4)*pr)),H=Math.max(40,Math.round((r.height||cv.height*4)*pr));
  cv.width=W;cv.height=H;cv.classList.add('a3d');const g=cv.getContext('2d');if(!g)return;
  const a=((arena-1)%5)+1,C=cenaCor(a),u=H/100;
  const rgba=(h,al)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${al})`;};
  // céu
  let gr=g.createLinearGradient(0,0,0,H*0.75);C.ceu.forEach((c,i)=>gr.addColorStop(i/(C.ceu.length-1),c));g.fillStyle=gr;g.fillRect(0,0,W,H);
  if(a>=3){for(let i=0;i<(a>=4?60:22);i++){const x=thsh(i,1,41)%W,y=thsh(i,2,41)%Math.round(H*0.5),s=(1+thsh(i,3,41)%3)*u*0.35;g.fillStyle=`rgba(255,255,240,${0.4+(i%3)*0.2})`;g.beginPath();g.arc(x,y,s,0,6.283);g.fill();}}
  // sol / lua
  const astro={1:[0.12,0.62,11,'#FFC070'],2:null,3:[0.82,0.3,7,'#DDE6E8'],4:[0.8,0.3,12,'#E8E4F8'],5:[0.93,0.14,7,'#F4F0DC']}[a];
  if(astro){const [fx,fy,rr,c]=astro,x=W*fx,y=H*fy,R=rr*u;gr=g.createRadialGradient(x,y,0,x,y,R*4);gr.addColorStop(0,rgba(c,0.55));gr.addColorStop(1,rgba(c,0));g.fillStyle=gr;g.fillRect(x-R*4,y-R*4,R*8,R*8);
    g.fillStyle=c;g.beginPath();g.arc(x,y,R,0,6.283);g.fill();if(a===5){g.fillStyle=C.ceu[1];g.beginPath();g.arc(x+R*0.45,y-R*0.25,R*0.85,0,6.283);g.fill();}}
  // nuvens fofas
  const nuvem=(x,y,s,c,c2)=>{g.fillStyle=c2;g.beginPath();g.ellipse(x+s*1.1,y+s*0.45,s*1.9,s*0.55,0,0,6.283);g.fill();g.fillStyle=c;g.beginPath();g.arc(x,y,s*0.75,0,6.283);g.arc(x+s*0.9,y-s*0.35,s,0,6.283);g.arc(x+s*1.9,y,s*0.7,0,6.283);g.ellipse(x+s*0.95,y+s*0.3,s*1.7,s*0.5,0,0,6.283);g.fill();};
  if(a===1){for(let i=0;i<3;i++)nuvem(W*((i*0.37+0.3)%1),H*(0.14+(i%2)*0.12),u*7,C.nuv,C.nuvs);}
  // morros (curvas suaves)
  const morro=(base,amp,fr,ph,c,hi)=>{g.fillStyle=c;g.beginPath();g.moveTo(0,H);for(let x=0;x<=W;x+=Math.max(2,W/120)){const y=base-amp*(0.6*Math.sin(x/W*fr+ph)+0.4*Math.sin(x/W*fr*2.3+ph*1.7));g.lineTo(x,y);}g.lineTo(W,H);g.closePath();g.fill();
    if(hi){g.strokeStyle=hi;g.lineWidth=u*1.2;g.beginPath();for(let x=0;x<=W;x+=Math.max(2,W/120)){const y=base-amp*(0.6*Math.sin(x/W*fr+ph)+0.4*Math.sin(x/W*fr*2.3+ph*1.7));x?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}};
  const yM=x=>H*0.5-H*0.06*(0.6*Math.sin(x/W*7+1.3)+0.4*Math.sin(x/W*16.1+2.2));
  morro(H*0.5,H*0.06,7,1.3,C.m1,null);
  // marcos no morro do fundo (silhuetas: nada de celeiro, moinho ou silo)
  const sil=(c)=>{g.fillStyle=c;g.strokeStyle=c;g.lineCap='round';};
  const mandacaru=(x,y,s,c)=>{sil(c);const w=s*0.18;g.fillRect(x-w/2,y-s,w,s);g.lineWidth=w*0.85;g.beginPath();g.moveTo(x-w/2,y-s*0.45);g.lineTo(x-s*0.3,y-s*0.45);g.lineTo(x-s*0.3,y-s*0.8);g.moveTo(x+w/2,y-s*0.6);g.lineTo(x+s*0.28,y-s*0.6);g.lineTo(x+s*0.28,y-s*0.9);g.stroke();
    g.beginPath();g.arc(x,y-s,w/2,Math.PI,0);g.fill();};
  const casa=(x,s,c,janela)=>{const y=yM(x)+s*0.12;sil(c);g.fillRect(x-s*0.7,y-s*0.6,s*1.4,s*0.6);g.beginPath();g.moveTo(x-s*0.85,y-s*0.55);g.lineTo(x,y-s*1.05);g.lineTo(x+s*0.85,y-s*0.55);g.closePath();g.fill();
    if(janela){g.fillStyle=janela;g.fillRect(x+s*0.2,y-s*0.42,s*0.2,s*0.18);}};
  const seca=(x,y,s,c)=>{sil(c);g.lineWidth=s*0.08;g.beginPath();g.moveTo(x,y);g.lineTo(x,y-s);g.moveTo(x,y-s*0.5);g.lineTo(x-s*0.4,y-s*0.85);g.moveTo(x,y-s*0.7);g.lineTo(x+s*0.35,y-s*1.0);g.moveTo(x-s*0.2,y-s*0.68);g.lineTo(x-s*0.3,y-s*1.05);g.stroke();};
  const copa=(x,y,s,c)=>{sil(c);g.beginPath();g.arc(x,y-s*0.9,s*0.6,0,6.283);g.arc(x-s*0.5,y-s*0.6,s*0.45,0,6.283);g.arc(x+s*0.5,y-s*0.62,s*0.48,0,6.283);g.fill();g.fillRect(x-s*0.08,y-s*0.5,s*0.16,s*0.5);};
  const s0=H*0.13;
  if(a===1){casa(W*0.7,s0,'#3A1E24','#FFC870');for(const [fx,k] of [[0.18,1.3],[0.42,0.9],[0.86,1.1]]){const x=W*fx;mandacaru(x,yM(x)+s0*0.2,s0*k,'#3A1E24');}}
  else if(a===2){for(let i=0;i<Math.ceil(W/(s0*1.8));i++){const x=i*s0*1.8+(thsh(i,3,43)%Math.round(s0));copa(x,yM(x)+s0*0.3,s0*1.1,'#0E2418');}
    for(const fx of [0.3,0.66]){const x=W*fx;gr=g.createLinearGradient(x,0,x+W*0.08,H*0.7);gr.addColorStop(0,'rgba(200,232,168,.22)');gr.addColorStop(1,'rgba(200,232,168,0)');g.fillStyle=gr;g.beginPath();g.moveTo(x,0);g.lineTo(x+W*0.04,0);g.lineTo(x+W*0.12,H*0.75);g.lineTo(x+W*0.06,H*0.75);g.closePath();g.fill();}}
  else if(a===3){g.strokeStyle='#0E2422';g.lineWidth=u*0.9;for(let i=0;i<Math.ceil(W/(s0*1.6));i++){const x=i*s0*1.6+(thsh(i,5,43)%Math.round(s0));const y=yM(x);g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+u,y-s0*0.6,x-u*0.5,y-s0*1.1);g.stroke();
      g.fillStyle='#0E2422';for(let k=0;k<6;k++){const an=-Math.PI/2+(k-2.5)*0.5;g.beginPath();g.ellipse(x-u*0.5+Math.cos(an)*s0*0.3,y-s0*1.1+Math.sin(an)*s0*0.2,s0*0.3,u*0.6,an,0,6.283);g.fill();}}}
  else if(a===4){casa(W*0.66,s0*1.1,'#0E0A1A','#9C7FF0');seca(W*0.22,yM(W*0.22)+s0*0.2,s0*1.6,'#0E0A1A');seca(W*0.9,yM(W*0.9)+s0*0.2,s0*1.2,'#0E0A1A');
    g.fillStyle='#F2C230';g.fillRect(W*0.22-s0*0.33,yM(W*0.22)-s0*1.05,u*0.8,u*0.8);g.fillRect(W*0.22-s0*0.26,yM(W*0.22)-s0*1.05,u*0.8,u*0.8);}
  else{const y0=H*0.22;g.strokeStyle='rgba(30,20,30,.9)';g.lineWidth=u*0.5;const cores=['#E8693A','#F2C230','#3FA34D','#4FB3E8','#B36BE8'];
    for(let f=0;f<2;f++){const ya=y0+f*H*0.1;g.beginPath();g.moveTo(0,ya);g.quadraticCurveTo(W/2,ya+H*0.12,W,ya);g.stroke();
      for(let i=0;i<Math.ceil(W/(u*7));i++){const x=i*u*7+u*3,t=x/W,y=ya*(1-t)*(1-t)+2*(1-t)*t*(ya+H*0.12)+t*t*ya;g.fillStyle=cores[(i+f*2)%5];g.beginPath();g.moveTo(x-u*2,y);g.lineTo(x+u*2,y);g.lineTo(x,y+u*4);g.closePath();g.fill();}}
    const fx=W*0.22,fy=yM(fx)+s0*0.2;gr=g.createRadialGradient(fx,fy,0,fx,fy,s0*3);gr.addColorStop(0,'rgba(255,170,80,.75)');gr.addColorStop(1,'rgba(255,170,80,0)');g.fillStyle=gr;g.fillRect(fx-s0*3,fy-s0*3,s0*6,s0*6);
    g.fillStyle='#FFB040';g.beginPath();g.moveTo(fx-s0*0.4,fy);g.quadraticCurveTo(fx-s0*0.3,fy-s0*0.6,fx,fy-s0*1.1);g.quadraticCurveTo(fx+s0*0.3,fy-s0*0.6,fx+s0*0.4,fy);g.closePath();g.fill();}
  morro(H*0.6,H*0.04,10,0.4,C.m2,null);
  morro(H*0.7,H*0.035,14,2.2,C.m3,rgba('#FFFFFF',0.08));
  // chão (sem lavoura em fileiras)
  gr=g.createLinearGradient(0,H*0.74,0,H);gr.addColorStop(0,C.lav[0]);gr.addColorStop(1,C.lav[1]);g.fillStyle=gr;g.fillRect(0,H*0.74,W,H*0.26);
  if(a===1){for(const [fx,k] of [[0.04,0.34],[0.3,0.24],[0.94,0.3]])mandacaru(W*fx,H*1.02,H*k,'#2A1418');}
  else if(a===2){for(let i=0;i<Math.ceil(W/(s0*3));i++){const x=i*s0*3+s0;copa(x,H*1.05,s0*1.3,'#0A1C12');}}
  else if(a===3){g.fillStyle=rgba('#2E7A88',0.5);g.fillRect(0,H*0.8,W,H*0.2);g.fillStyle='#2E6A3A';for(let i=0;i<7;i++){const x=W*((i*0.17+0.05)%1),y=H*(0.86+(i%3)*0.04);g.beginPath();g.ellipse(x,y,u*4,u*1.4,0,0.3,6.0);g.lineTo(x,y);g.fill();}
    for(let i=0;i<14;i++){const x=thsh(i,7,45)%W,y=H*0.4+thsh(i,8,45)%Math.round(H*0.5);gr=g.createRadialGradient(x,y,0,x,y,u*2.4);gr.addColorStop(0,'rgba(220,255,140,.9)');gr.addColorStop(1,'rgba(220,255,140,0)');g.fillStyle=gr;g.fillRect(x-u*3,y-u*3,u*6,u*6);}}
  else if(a===4){for(let i=0;i<10;i++){const x=thsh(i,9,47)%W,y=H*0.5+thsh(i,10,47)%Math.round(H*0.45);gr=g.createRadialGradient(x,y,0,x,y,u*2);gr.addColorStop(0,'rgba(180,160,255,.85)');gr.addColorStop(1,'rgba(180,160,255,0)');g.fillStyle=gr;g.fillRect(x-u*3,y-u*3,u*6,u*6);}
    g.fillStyle='rgba(140,120,200,.12)';g.fillRect(0,H*0.62,W,H*0.12);}
  else{for(let i=0;i<18;i++){const x=thsh(i,11,49)%W,y=H*0.35+thsh(i,12,49)%Math.round(H*0.6);gr=g.createRadialGradient(x,y,0,x,y,u*2.2);gr.addColorStop(0,'rgba(255,200,100,.95)');gr.addColorStop(1,'rgba(255,200,100,0)');g.fillStyle=gr;g.fillRect(x-u*3,y-u*3,u*6,u*6);}}
  // leitura do texto: escurece embaixo à esquerda
  gr=g.createLinearGradient(0,H*0.5,0,H);gr.addColorStop(0,'rgba(10,8,6,0)');gr.addColorStop(1,'rgba(10,8,6,.35)');g.fillStyle=gr;g.fillRect(0,0,W,H);
}
/* ---------- pacotes e baús (desenhados em código) ---------- */
function paintPack(cv,tipo,part){
  const g=cv.getContext('2d');if(!g)return;
  const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const S=tipo==='semente';
  const base=S?'#B98A55':'#1E1A2A',dk=S?'#7A5530':'#0E0A16',hi=S?'#DDB27A':'#3A3050',f1=S?'#8A6A3E':'#5A3E8C',f2=S?'#CCA06A':'#7B5BD6',ol='#1A1420'; // v10: Causo (papel kraft, cordel) e Assombro (papel preto, lacre violeta)
  const W=48;
  const top=part!=='body',body=part!=='top';
  const oy=part==='body'?-10:0;
  g.clearRect(0,0,cv.width,cv.height);
  if(top){
    // tira de cima, serrilhada
    R(ol,2,1+oy,44,9);R(hi,3,2+oy,42,7);R(base,3,5+oy,42,4);
    for(let x=3;x<45;x+=2)R(ol,x,1+oy,1,1);
    for(let x=4;x<45;x+=3)R(dk,x,3+oy,1,5);
  }
  if(body){
    R(ol,1,10+oy,46,53);R(base,2,10+oy,44,52);
    // faixas de foil em diagonal (dither)
    for(let y=10;y<62;y++)for(let x=2;x<46;x++){const d=(x+y)%14;if(d<2)R(f1,x,y+oy,1,1);else if(d===2&&(x+y)%2===0)R(f2,x,y+oy,1,1);}
    R(hi,2,10+oy,2,52);R(dk,44,10+oy,2,52);R(dk,2,60+oy,44,2);
    // selo central
    R(ol,12,22+oy,24,24);R('#2A2219',13,23+oy,22,22);R(S?'#E9DDC2':'#7B5BD6',14,24+oy,20,20);R(S?'#B8A47E':'#4A2F80',14,42+oy,20,2);
    if(S){ // folheto de cordel com xilogravura
      R('#2A1E14',17,26+oy,14,15);R('#E9DDC2',18,27+oy,12,13);R('#2A1E14',19,29+oy,10,1);
      R('#2A1E14',21,31+oy,6,6);R('#E9DDC2',22,32+oy,2,2);R('#2A1E14',20,37+oy,8,1);R('#2A1E14',19,39+oy,4,1);R('#2A1E14',25,39+oy,4,1);
    }else{ // lacre com lua crescente
      R('#2E1F05',17,27+oy,14,14);R('#9C7FF0',18,28+oy,12,12);R('#F4E3B5',21,30+oy,5,8);R('#9C7FF0',23,30+oy,4,7);R('#C8B8FF',18,28+oy,2,2);
    }
    // faixa do nome
    R(ol,4,48+oy,40,9);R(S?'#6A4428':'#2A2040',5,49+oy,38,7);
    for(let x=7;x<41;x+=3)R(S?'#E9DDC2':'#B9A6F0',x,52+oy,2,1);
  }
}
const CHEST_COL={ // v10: bornal de couro, botija de barro, botija com ouro, botija violeta, botija lendária
 madeira:{b:'#8A5A32',d:'#5A361C',h:'#B88252',band:'#3A2414',lk:'#D9A066'},
 prata:{b:'#B06A3E',d:'#7A4426',h:'#D8945A',band:'#4A2A18',lk:'#E9DDC2'},
 ouro:{b:'#B06A3E',d:'#7A4426',h:'#F2C230',band:'#8A4A12',lk:'#FFE58A'},
 encantado:{b:'#5A3E8C',d:'#3A2560',h:'#9C7FF0',band:'#1E1630',lk:'#C8B8FF'},
 lendario:{b:'#7A2A1E',d:'#4A160E',h:'#F2C230',band:'#F2C230',lk:'#FFF3D0'}
};
function paintChest(cv,tipo,part){
  const g=cv.getContext('2d');if(!g)return;
  const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
  const C=CHEST_COL[tipo]||CHEST_COL.madeira,ol='#1A1420';
  g.clearRect(0,0,cv.width,cv.height);
  const oy=part==='base'?-9:0;
  if(part!=='base'){ // tampa (y 0..8)
    R(ol,3,1+oy,26,9);R(ol,2,3+oy,28,7);R(C.b,4,2+oy,24,7);R(C.b,3,4+oy,26,5);R(C.h,4,2+oy,24,1);R(C.h,3,4+oy,2,4);R(C.d,3,8+oy,26,1);
    R(C.band,8,1+oy,3,8);R(C.band,21,1+oy,3,8);
  }
  if(part!=='lid'){ // base (y 9..23)
    R(ol,2,9+oy,28,15);R(C.b,3,9+oy,26,13);R(C.d,3,19+oy,26,3);R(C.h,3,10+oy,26,1);
    R(C.band,8,9+oy,3,13);R(C.band,21,9+oy,3,13);
    R(ol,13,10+oy,6,7);R(C.lk,14,11+oy,4,5);R(ol,15,13+oy,2,2);
  }
}
function chestImg(tipo,px,cls){
  // pequena imagem do baú (canvas 32x24)
  return `<canvas class="chest-cv ${cls||''}" width="32" height="24" data-chest="${tipo}" style="width:${px}px;height:${px*0.75}px" aria-hidden="true"></canvas>`;
}
function packImg(tipo,px,cls){
  return `<canvas class="pack-cv ${cls||''}" width="48" height="64" data-pack="${tipo}" style="width:${px}px;height:${Math.round(px*64/48)}px" aria-hidden="true"></canvas>`;
}
function hydrateGfx(root){
  hydrate(root);
  const tres=[];
  (root||document).querySelectorAll('canvas[data-chest]:not([data-p]),canvas[data-pack]:not([data-p])').forEach(cv=>{cv.dataset.p=1;const part=cv.dataset.part||'all';
    if(part==='all'&&typeof R3D!=='undefined'&&R3D.quer(cv)){tres.push(cv);return;}
    if(cv.dataset.chest)paintChest(cv,cv.dataset.chest,part);else paintPack(cv,cv.dataset.pack,part);});
  if(tres.length)R3D.pedir(tres);
  (root||document).querySelectorAll('canvas[data-scene]:not([data-p])').forEach(cv=>{cv.dataset.p=1;try{paintSceneLisa(cv,+cv.dataset.scene);}catch(e){paintScene(cv,+cv.dataset.scene);}});
  (root||document).querySelectorAll('canvas[data-regra]:not([data-p])').forEach(cv=>{cv.dataset.p=1;try{paintRegraLisa(cv,cv.dataset.regra);}catch(e){paintRegra(cv,cv.dataset.regra);}});
}

/* ---------- v4: carta da regra (Desafio do Dia / Regra especial): mini cena em pixel + ícone grande ---------- */
function regraCardHTML(id,o){
  o=o||{};const G=REGRA[id];if(!G)return '';
  return `<div class="rgcard rg-${id} ${o.cls||''}" role="group" aria-label="Regra: ${escH(G.nome)}. ${escH(G.txt)}">
    <div class="rgsc"><canvas data-regra="${id}" width="70" height="24" aria-hidden="true"></canvas><span class="rgic">${ic(G.ic,40)}</span><span class="rgnm">${escH(G.nome)}</span></div>
    <div class="rgtx">${escH(G.txt)}</div></div>`;
}
/* v9: cena da regra lisa (degradê do céu, chão redondo e alguns detalhes); o ícone grande vetorial fica por cima */
function paintRegraLisa(cv,id){
  const r=cv.getBoundingClientRect();const pr=Math.min(window.devicePixelRatio||1,2);
  const W=Math.max(140,Math.round((r.width||cv.width*4)*pr)),H=Math.max(48,Math.round((r.height||cv.height*4)*pr));
  cv.width=W;cv.height=H;cv.classList.add('a3d');const g=cv.getContext('2d');if(!g)return;const u=H/24;
  const P={chuva:['#2B3A55','#4A7FC1','#9FD4F0','#4E9A3A'],seca:['#E8862E','#F2C230','#F4E3B5','#D9A066'],ventania:['#4A7FC1','#9FD4F0','#F4E3B5','#4E9A3A'],feira:['#9FD4F0','#F4E3B5','#F4E3B5','#D9A066'],
    corvos:['#2B3A55','#5A3E8C','#2B3A55','#2F5E2A'],lua:['#1A2240','#2B3A55','#5A3E8C','#2F5E2A'],colheita:['#E8862E','#F2C230','#F4E3B5','#A0673A'],mutirao:['#9FD4F0','#F4E3B5','#F4E3B5','#4E9A3A'],
    familias:['#9FD4F0','#F4E3B5','#F4E3B5','#4E9A3A'],duplas:['#5A3E8C','#A77BE0','#F49AC1','#5A3E8C'],cerca:['#9FD4F0','#F4E3B5','#F4E3B5','#4E9A3A']}[id]||['#9FD4F0','#F4E3B5','#F4E3B5','#4E9A3A'];
  let gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,P[0]);gr.addColorStop(0.45,P[1]);gr.addColorStop(0.8,P[2]);g.fillStyle=gr;g.fillRect(0,0,W,H);
  if(id==='corvos'||id==='lua'){for(let i=0;i<24;i++){g.fillStyle='rgba(255,255,240,.8)';g.beginPath();g.arc(thsh(i,1,7)%W,thsh(i,2,7)%Math.round(H*0.55),u*(0.2+(i%3)*0.12),0,6.283);g.fill();}}
  if(id==='seca'||id==='colheita'){const x=W*0.16,y=H*0.3;gr=g.createRadialGradient(x,y,0,x,y,u*9);gr.addColorStop(0,'rgba(255,240,180,.9)');gr.addColorStop(1,'rgba(255,240,180,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle='#FFE58A';g.beginPath();g.arc(x,y,u*3,0,6.283);g.fill();}
  if(id==='chuva'){g.strokeStyle='rgba(220,240,255,.7)';g.lineWidth=u*0.35;g.lineCap='round';for(let i=0;i<30;i++){const x=thsh(i,3,9)%W,y=thsh(i,4,9)%Math.round(H*0.7);g.beginPath();g.moveTo(x,y);g.lineTo(x-u*0.6,y+u*1.8);g.stroke();}}
  if(id==='ventania'){g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=u*0.5;g.lineCap='round';for(let i=0;i<5;i++){const y=H*(0.15+i*0.11),x=(thsh(i,5,9)%Math.round(W*0.5));g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+W*0.15,y-u,x+W*0.25,y+u,x+W*0.35,y);g.stroke();}}
  if(id==='feira'){for(let x=W*0.1;x<W*0.9;x+=u*3){g.fillStyle=((x/(u*3))|0)%2?'#E0565B':'#FFFFFF';g.beginPath();g.moveTo(x,H*0.18);g.lineTo(x+u*3,H*0.18);g.lineTo(x+u*1.5,H*0.36);g.closePath();g.fill();}}
  // chão
  g.fillStyle=P[3];g.beginPath();g.moveTo(0,H);g.lineTo(0,H*0.78);g.quadraticCurveTo(W*0.5,H*0.66,W,H*0.78);g.lineTo(W,H);g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=u*0.4;g.beginPath();g.moveTo(0,H*0.78);g.quadraticCurveTo(W*0.5,H*0.66,W,H*0.78);g.stroke();
  if(id==='cerca'){g.fillStyle='#D9A066';for(let x=u*2;x<W;x+=u*6){g.fillRect(x,H*0.48,u*1.2,H*0.36);}g.fillRect(0,H*0.58,W,u*0.9);g.fillRect(0,H*0.7,W,u*0.9);}
  gr=g.createLinearGradient(0,H*0.4,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(0,0,W,H);
}
function paintRegra(cv,id){
  const g=cv.getContext('2d');if(!g)return;const W=cv.width,H=cv.height,P=PAL;
  const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w|0,h|0);};
  const hs=(x,y)=>(((x*73856093)^(y*19349663))>>>0);
  const ceu=(a,b,c)=>{R(a,0,0,W,6);R(b,0,6,W,7);R(c,0,13,W,H-13);};
  const chao=(c1,c2,y)=>{y=y||18;for(let x=0;x<W;x++){const t=y+((hs(x,3)%3)===0?-1:0);R(c1,x,t,1,H-t);if(hs(x,4)%4===0)R(c2,x,t,1,1);}};
  const estrelas=n=>{for(let k=0;k<n;k++)R(k%3?P.lg:P.wh,hs(k,7)%W,hs(k,8)%12,1,1);};
  const nuvem=(x,y,c,c2)=>{R(c,x+2,y,8,1);R(c,x,y+1,12,2);R(c2||c,x+1,y+3,10,1);};
  const sol=(x,y)=>{R(P.yl,x-3,y-3,7,7);R(P.yl,x-4,y-2,9,5);R(P.yl,x-2,y-4,5,9);R(P.cr,x-2,y-2,3,2);for(const [dx,dy] of [[-7,0],[7,0],[0,-7],[0,7],[-5,-5],[5,5],[-5,5],[5,-5]])R(P.or,x+dx,y+dy,1,1);};
  const milho=(x,y,c)=>{R(P.gd,x,y-6,1,7);R(P.gr,x-1,y-3,1,2);R(P.gr,x+1,y-5,1,2);R(c||P.yl,x,y-8,1,3);};
  switch(id){
    case 'chuva':ceu(P.nt,P.bl,P.sk);nuvem(6,2,P.lg,P.gy);nuvem(40,1,P.wh,P.lg);nuvem(56,4,P.lg,P.gy);
      for(let k=0;k<26;k++){const x=hs(k,1)%W,y=6+hs(k,2)%10;R(P.sk,x,y,1,2);}
      chao(P.gr,P.lm,19);for(let x=3;x<W;x+=6){R(P.lm,x,17,1,2);R(P.lm,x-1,16,1,1);R(P.lm,x+1,16,1,1);}break;
    case 'seca':ceu(P.or,P.yl,P.cr);sol(10,6);
      for(let x=0;x<W;x++){const brejo=x>=W/2;const t=18+((hs(x,3)%3)===0?-1:0);R(brejo?P.tq:P.st,x,t,1,H-t);R(brejo?P.sk:P.wo,x,t,1,1);if(!brejo&&hs(x,5)%5===0)R(P.wd,x,t+2+hs(x,6)%3,2,1);if(brejo&&hs(x,9)%6===0)R(P.td,x,t+3,3,1);}
      R(P.ol,W/2,15,1,9);R(P.wh,W/2-3,14,7,1);R(P.ol,W/2-4,13,1,3);R(P.ol,W/2+4,13,1,3);break;
    case 'ventania':ceu(P.bl,P.sk,P.cr);for(let k=0;k<6;k++){const y=3+k*2.4,x=(hs(k,1)%40);R(P.wh,x,y,14+hs(k,2)%10,1);R(P.wh,x+14,y-1,3,1);}
      for(let k=0;k<7;k++)R(k%2?P.lm:P.or,8+hs(k,3)%56,4+hs(k,4)%12,2,1);
      chao(P.gr,P.lm,19);for(let x=1;x<W;x+=3){R(P.gr,x,16,1,3);R(P.lm,x+1,15,1,1);}break;
    case 'feira':ceu(P.sk,P.cr,P.cr);
      for(let x=8;x<W-8;x+=2){R(x%4?P.rd:P.wh,x,4,2,4);}R(P.ol,8,8,W-16,1);R(P.wd,9,8,1,10);R(P.wd,W-10,8,1,10);
      R(P.wo,10,13,W-20,5);R(P.st,10,13,W-20,1);for(let x=14;x<W-14;x+=5){R(x%10?P.or:P.rd,x,11,3,2);R(P.lm,x+1,10,1,1);}
      chao(P.st,P.wo,19);break;
    case 'corvos':ceu(P.nt,P.pu,P.nt);estrelas(14);R(P.cr,58,3,4,4);R(P.nt,60,3,2,2);
      for(const [x,y] of [[12,6],[26,3],[38,8],[48,4]]){R(P.ol,x,y,7,1);R(P.ol,x+2,y-1,3,1);R(P.ol,x+3,y+1,1,1);R(P.ol,x-1,y-1,1,1);R(P.ol,x+7,y-1,1,1);}
      chao(P.gd,P.gr,19);for(let x=4;x<W;x+=9)milho(x,19,P.wd);break;
    case 'lua':ceu(P.nt,P.nt,P.pu);estrelas(22);
      R(P.cr,30,2,10,10);R(P.cr,29,4,12,6);R(P.cr,32,1,6,12);R(P.lg,32,5,2,2);R(P.lg,36,8,2,1);R(P.wh,32,3,2,1);
      chao(P.gd,P.gr,19);for(let x=3;x<W;x+=7)R(P.td,x,18,3,1);break;
    case 'colheita':ceu(P.or,P.yl,P.cr);R(P.rd,0,12,W,1);
      chao(P.wo,P.st,20);for(let x=2;x<W;x+=4)milho(x,20,P.yl);break;
    case 'mutirao':ceu(P.sk,P.cr,P.cr);chao(P.gr,P.lm,19);
      for(let k=0;k<6;k++){const x=11+k*8,y=7+Math.abs(k-2.5)*1.2;R(P.ol,x-1,y-1,8,11);R(P.cr,x,y,6,9);R([P.yl,P.rd,P.tq,P.lm,P.wo,P.pk][k],x+1,y+1,4,4);}break;
    case 'familias':ceu(P.sk,P.cr,P.cr);
      for(let x=0;x<W;x+=4){const y=3+Math.round(Math.sin(x/9)*1.5);R(P.ol,x,y,4,1);R([P.rd,P.yl,P.bl,P.lm,P.pk][(x/4)%5],x+1,y+1,2,3);R([P.rd,P.yl,P.bl,P.lm,P.pk][(x/4)%5],x+1,y+4,1,1);}
      chao(P.gr,P.lm,19);
      for(const [x,c] of [[16,P.wh],[30,P.cr],[44,P.st]]){R(P.ol,x-1,12,10,7);R(c,x,13,8,5);R(P.ol,x+6,14,1,1);R(P.ol,x+1,18,1,2);R(P.ol,x+6,18,1,2);}break;
    case 'duplas':ceu(P.pu,P.li,P.pk);estrelas(6);
      for(const x of [16,42]){R(P.ol,x-1,5,13,17);R(P.cr,x,6,11,15);R(x<30?P.yl:P.bl,x+1,7,9,8);}
      R(P.wh,31,12,8,2);R(P.wh,34,9,2,8);break;
    case 'cerca':ceu(P.sk,P.cr,P.cr);chao(P.gr,P.lm,20);
      for(let x=0;x<W;x+=2){const t=9+((hs(x,2)%3));R(P.gd,x,t,2,20-t);R(P.gr,x,t,1,1);if(hs(x,5)%5===0)R(P.pk,x,t+2,1,1);}
      for(let x=5;x<W;x+=12){R(P.wd,x,7,2,13);R(P.wo,x,7,1,13);}break;
    default:ceu(P.sk,P.cr,P.cr);chao(P.gr,P.lm,19);
  }
}

/* ===================== TABULEIRO: canteiros, cerca, estrada e cenário vivo (tudo desenhado em código) ===================== */
const TEX={};
const thsh=(x,y,k)=>{let h=(x*374761393+y*668265263+(k||0)*2147483647)>>>0;h=(h^(h>>>13))*1274126177>>>0;return (h^(h>>>16))>>>0;};
function texURL(key,w,h,fn){
  if(TEX[key]!=null)return TEX[key];
  let u='';
  try{const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
    if(g){const R=(c,x,y,ww,hh)=>{g.fillStyle=c;g.fillRect(x,y,ww||1,hh||1);};
      // repete nas bordas para o ladrilho não ter emenda
      const RW=(c,x,y,ww,hh)=>{ww=ww||1;hh=hh||1;for(const dx of [0,-w,w])for(const dy of [0,-h,h])R(c,x+dx,y+dy,ww,hh);};
      fn(g,R,RW,w,h);u=cv.toDataURL('image/png');}
  }catch(e){u='';}
  TEX[key]=u;return u;
}
/* chão dos canteiros (ladrilho 32x32) */
function texTerreno(t){
  return texURL('t-'+t,32,32,(g,R,RW,W,H)=>{
    if(t==='milharal'){
      for(let y=0;y<H;y++){const m=y%8;R(m<1?'#B07A45':m<4?'#8E5C33':m<5?'#6A4224':'#4A2B16',0,y,W,1);}
      for(let i=0;i<70;i++){const x=thsh(i,1,7)%W,y=thsh(i,2,7)%H,m=y%8;R(m<4?(thsh(i,3)%2?'#A06A3C':'#7E5030'):'#3E2412',x,y);}
      for(let i=0;i<10;i++){const x=thsh(i,4,7)%W,y=(thsh(i,5,7)%4)*8+6;R('#E8C060',x,y,2,1);}
      for(let r=0;r<4;r++)for(let k=0;k<3;k++){const x=(k*11+r*5+3)%W,y=r*8+1;RW('#6CB843',x,y,1,2);RW('#9BD34B',x-1,y-1);RW('#4E9A3A',x+1,y-1);}
      for(let i=0;i<8;i++){const x=thsh(i,6,7)%W,y=thsh(i,7,7)%H;R('#C8AE88',x,y);}
    }else if(t==='pomar'){
      // gramado de pomar: verde-oliva com sombra de copa, pétalas rosadas, folhas secas e frutas caídas
      R('#467A33',0,0,W,H);
      for(let i=0;i<150;i++){const x=thsh(i,1,3)%W,y=thsh(i,2,3)%H;R(thsh(i,3,3)%3?'#3A6A2C':'#5A8E3C',x,y,1,2);}
      for(let i=0;i<3;i++){const cx=thsh(i,10,3)%W,cy=thsh(i,11,3)%H;for(let y=-3;y<=3;y++)for(let x=-5;x<=5;x++)if(x*x/25+y*y/9<=1&&thsh(x+9,y+9,i)%3)RW('#3A6A2C',cx+x,cy+y);}
      for(let i=0;i<10;i++){const x=thsh(i,12,3)%W,y=thsh(i,13,3)%H;RW(i%2?'#C8963A':'#A8742C',x,y,2,1);}
      const maca=(x,y)=>{RW('#7A1F22',x,y+2,3,1);RW('#C4362F',x,y,3,2);RW('#E8564A',x,y,1,1);RW('#F49A8A',x+1,y,1,1);RW('#4B2C17',x+1,y-1,1,1);};
      maca(4,6);maca(21,20);maca(13,27);maca(27,4);maca(9,15);
      for(let i=0;i<22;i++){const x=thsh(i,6,3)%W,y=thsh(i,7,3)%H;RW('#F49AC1',x,y);RW('#FFE4F0',x+1,y);RW('#F49AC1',x,y+1);}
      for(let i=0;i<6;i++){const x=thsh(i,8,3)%W,y=thsh(i,9,3)%H;RW('#9BD34B',x,y,2,1);}
    }else if(t==='brejo'){
      R('#2C7A74',0,0,W,H);
      for(let i=0;i<50;i++){const x=thsh(i,1,5)%W,y=thsh(i,2,5)%H;R('#24655F',x,y,2+thsh(i,3)%3,1);}
      for(let i=0;i<16;i++){const x=thsh(i,4,5)%W,y=thsh(i,5,5)%H;RW('#5FC0B4',x,y,2+thsh(i,6)%3,1);}
      const vit=(x,y)=>{RW('#2F6E2A',x-1,y+2,6,1);RW('#4E9A3A',x-1,y,6,2);RW('#4E9A3A',x,y-1,4,1);RW('#6CB843',x,y,2,1);RW('#2C7A74',x+2,y,1,1);};
      vit(5,7);vit(20,18);vit(10,26);
      RW('#F49AC1',21,17);RW('#FFE4F0',22,17);RW('#F49AC1',6,6);
      for(let i=0;i<5;i++){const x=thsh(i,7,5)%W,y=thsh(i,8,5)%H;RW('#CFF5F0',x,y);}
    }else if(t==='pasto'){
      R('#5FAA3C',0,0,W,H);
      for(let i=0;i<170;i++){const x=thsh(i,1,9)%W,y=thsh(i,2,9)%H;R(thsh(i,3,9)%3?'#78C24E':'#4E9A3A',x,y,1,2);}
      for(let i=0;i<12;i++){const x=thsh(i,4,9)%W,y=thsh(i,5,9)%H;const c=['#FFFFFF','#F2C230','#C9A6FF','#FFFFFF'][i%4];RW(c,x,y);RW(c,x-1,y+1);RW(c,x+1,y+1);RW(c,x,y+2);RW('#F2C230',x,y+1);}
      for(let i=0;i<6;i++){const x=thsh(i,6,9)%W,y=thsh(i,7,9)%H;RW('#9BD34B',x,y,1,3);}
    }else{
      R('#7A5634',0,0,W,H);for(let i=0;i<60;i++)R(thsh(i,1,11)%2?'#8E6840':'#5E4026',thsh(i,2,11)%W,thsh(i,3,11)%H);
    }
  });
}
/* fileira do fundo do canteiro (milho, copa de árvore, taboa, capim): ladrilho 32x24 transparente, repete na horizontal */
function texFileira(t){
  return texURL('f-'+t,32,24,(g,R,RW,W,H)=>{
    if(t==='milharal'){
      for(const [x0,hh] of [[1,22],[9,19],[17,23],[25,20]]){
        const top=H-hh;R('#3E7A2C',x0+1,top,2,hh);R('#6CB843',x0+1,top,1,hh);
        R('#E8C060',x0+1,top-2,1,3);R('#E8C060',x0,top-1,1,2);R('#E8C060',x0+3,top-1,1,2);
        for(const [ly,dir] of [[top+7,1],[top+12,-1],[top+16,1]]){for(let k=1;k<5;k++)R(k<3?'#5DAA45':'#4E9A3A',x0+1+dir*k+(dir>0?1:0),ly+(k>>1),1,1);}
        const cy=top+8;R('#9BD34B',x0+3,cy,2,6);R('#F2C230',x0+3,cy+1,2,4);R('#FFE58A',x0+3,cy+1,1,2);R('#B9801C',x0+4,cy+4,1,1);
      }
    }else if(t==='pomar'){
      for(const [cx,cy,r] of [[4,12,7],[14,9,8],[25,12,7],[33,10,6],[-3,10,6]]){
        for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){if(x*x+y*y>r*r)continue;const px=cx+x,py=cy+y;if(px<0||px>=W||py<0||py>=H)continue;
          R(y<-r/3?(x<0?'#5DAA45':'#3E8A34'):y>r/2?'#24521F':'#2F6E2A',px,py);}
      }
      for(const [x,y] of [[3,13],[13,6],[18,13],[24,9],[28,15],[9,16]]){R('#C4362F',x,y,2,2);R('#F49A8A',x,y);}
      for(const [x,y] of [[6,7],[16,11],[26,6],[11,4]]){R('#FFE4F0',x,y);R('#F49AC1',x+1,y);}
      for(const x of [6,16,27]){R('#4B2C17',x,19,2,5);R('#6B4630',x,19,1,5);}
    }else if(t==='brejo'){
      for(let i=0;i<11;i++){const x=(i*3+thsh(i,1,13)%2)%W,hh=10+thsh(i,2,13)%12,top=H-hh;R(i%2?'#3E8A34':'#5DAA45',x,top,1,hh);
        if(i%3===0){R('#6B4630',x,top-4,2,5);R('#8E5F38',x,top-4,1,2);R('#5DAA45',x,top-6,1,2);}
        else if(i%3===1){R('#6CB843',x+1,top+3,1,1);R('#6CB843',x+2,top+2,1,1);}}
    }else if(t==='pasto'){
      for(let i=0;i<14;i++){const x=(i*7+thsh(i,1,17)%3)%W,hh=6+thsh(i,2,17)%9,top=H-hh;
        for(let k=-1;k<=1;k++)R(k?'#4E9A3A':'#78C24E',x+k*2,top+Math.abs(k)*3,1,hh-Math.abs(k)*3);
        if(i%4===0){R('#3E7A2C',x+1,top-5,1,6);R('#FFFFFF',x,top-7,3,1);R('#FFFFFF',x+1,top-8,1,3);R('#F2C230',x+1,top-7);}
        if(i%5===2){R('#3E7A2C',x+3,top-3,1,4);R('#F2C230',x+2,top-4,3,2);}}
    }
  });
}
/* chão do campo, estrada do meio e cerca */
function texChao(arena){
  return texURL('chao',32,32,(g,R,RW,W,H)=>{
    R('#2E5A26',0,0,W,H);
    for(let i=0;i<150;i++){const x=thsh(i,1,21)%W,y=thsh(i,2,21)%H;R(thsh(i,3,21)%3?'#264E20':'#3A6E2E',x,y,1,2);}
    for(let i=0;i<5;i++){const x=thsh(i,4,21)%W,y=thsh(i,5,21)%H;RW('#4E3A22',x,y,3,2);RW('#5E4628',x+1,y,1,1);}
    for(let i=0;i<6;i++){const x=thsh(i,6,21)%W,y=thsh(i,7,21)%H;RW('#F2C230',x,y);}
  });
}
function texEstrada(){
  return texURL('estrada',32,32,(g,R,RW,W,H)=>{
    R('#9C7A4E',0,0,W,H);
    for(let i=0;i<120;i++){const x=thsh(i,1,23)%W,y=thsh(i,2,23)%H;R(thsh(i,3,23)%2?'#B08A5A':'#87683F',x,y,2,1);}
    for(const y of [9,22]){R('#7A5A36',0,y,W,2);R('#6A4C2C',0,y+1,W,1);}
    for(let i=0;i<9;i++){const x=thsh(i,4,23)%W,y=thsh(i,5,23)%H;RW('#D8C29A',x,y,2,1);RW('#6E5234',x,y+1,2,1);}
  });
}
function texCerca(){
  return texURL('cerca',8,7,(g,R,RW,W,H)=>{
    R('#4B2C17',0,2,W,1);R('#B9844F',0,1,W,1);R('#4B2C17',0,5,W,1);R('#B9844F',0,4,W,1);
    R('#2A180C',0,0,3,7);R('#C99560',0,0,1,6);R('#9A6A3E',1,0,1,6);R('#6B4426',2,0,1,6);R('#F4E3B5',0,0,1,1);
  });
}
function texMadeira(rival){
  return texURL('mad-'+(rival?'r':'p'),16,16,(g,R,RW,W,H)=>{
    const b=rival?'#7A3E26':'#A0683A',d=rival?'#5A2A18':'#7E5030',l=rival?'#9A5436':'#C08452';
    R(b,0,0,W,H);for(let y=0;y<H;y+=4)R(d,0,y+3,W,1);for(let i=0;i<14;i++)R(i%2?l:d,thsh(i,1,rival?31:29)%W,thsh(i,2,rival?31:29)%H,2,1);
  });
}
function texturasTabuleiro(el){
  if(!el)return;
  const st=el.style;
  for(const t of ['milharal','pomar','brejo','pasto']){const u=texTerreno(t),f=texFileira(t);if(u)st.setProperty('--tx-'+t,`url("${u}")`);if(f)st.setProperty('--fl-'+t,`url("${f}")`);}
  const c=texChao(),e=texEstrada(),k=texCerca(),mp=texMadeira(false),mr=texMadeira(true);
  if(c)st.setProperty('--tx-chao',`url("${c}")`);if(e)st.setProperty('--tx-estrada',`url("${e}")`);if(k)st.setProperty('--tx-cerca',`url("${k}")`);
  if(mp)st.setProperty('--tx-mad-p',`url("${mp}")`);if(mr)st.setProperty('--tx-mad-r',`url("${mr}")`);
}

/* ---------- cenário vivo (fundo da batalha): céu com hora do dia por arena, morros, lavoura e bichinhos ---------- */
const CENA={cv:null,g:null,arena:1,W:0,H:0,S:3,hz:0,est:null,raf:0,last:0,t0:0,itens:null,raio:0};
const CEN_COR={ // v10: os céus das 5 arenas de Mata Adentro (Sertão, Mata, Igapó, Tapera, Arraial)
  1:{nome:'poente do sertão',ceu:['#2A1E3E','#4A2A48','#8A3E40','#C8603A','#E8904A','#F4B868'],m1:'#6A3A3A',m2:'#7A4A30',m3:'#5E3A24',lav:['#8A5A34','#7A4C2A'],nuv:'#E8A070',nuvs:'#9A5A50',luz:'#FFC870'},
  2:{nome:'mata fechada',ceu:['#0E1E1A','#14302A','#1E4436','#2E5E46','#4E7E5A','#7EA27A'],m1:'#1A3426',m2:'#14301E',m3:'#102818',lav:['#1C3C1C','#244822'],nuv:'#9AB8A0',nuvs:'#5A7A66',luz:'#C8E8A8'},
  3:{nome:'igapó',ceu:['#0A1624','#12283A','#1E3E52','#2E5A6A','#4E7E86','#8AB0A8'],m1:'#1E3C3A',m2:'#183230',m3:'#122826',lav:['#103A48','#164A58'],nuv:'#88A4A2',nuvs:'#5A7A7A',luz:'#E8F0E0'},
  4:{nome:'tapera',ceu:['#06040E','#0E0A1E','#18122E','#241C44','#342A5A','#4A3E74'],m1:'#1E1A30',m2:'#18142A','m3':'#120E22',lav:['#1A1A2C','#22223A'],nuv:'#2E2A4A',nuvs:'#1E1C34',luz:'#E8E4F8'},
  5:{nome:'arraial',ceu:['#070A1C','#0E1430','#1E1640','#3A2458','#6A3060','#A8463E'],m1:'#2A2032',m2:'#22182A',m3:'#1A1220',lav:['#3A3222','#2E2818'],nuv:'#5A3A58',nuvs:'#3E2A44',luz:'#FFB860'}
};
function cenaCor(a){return CEN_COR[a]||CEN_COR[((a-1)%5)+1];}
function cenaIniciar(cv,arena){
  CENA.cv=cv;CENA.g=cv?cv.getContext('2d'):null;CENA.arena=arena||1;CENA.t0=performance.now();CENA.est=null;CENA.itens=null;CENA.raio=0;
  cenaMedir();cenaQuadro(performance.now(),true);
  if(!RM)cenaLoop();
}
function cenaParar(){if(CENA.raf)cancelAnimationFrame(CENA.raf);CENA.raf=0;CENA.cv=null;CENA.g=null;CENA.est=null;CENA.itens=null;}
function cenaMedir(){
  const cv=CENA.cv;if(!cv)return;
  const vw=Math.max(1,window.innerWidth),vh=Math.max(1,window.innerHeight);
  const S=vw>=900?4:3;CENA.S=S;
  const W=Math.ceil(vw/S),H=Math.ceil(vh/S);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  CENA.W=W;CENA.H=H;
  // linha do horizonte: no celular fica atrás do topo (céu e morros aparecem por cima do campo); no computador, mais baixo
  CENA.hz=Math.round(vw>=700?H*0.4:Math.min(H*0.2,150/S));
  CENA.est=null;CENA.itens=null;
}
function cenaLoop(){
  if(CENA.raf)return;
  const f=now=>{CENA.raf=0;if(!CENA.cv||!CENA.cv.isConnected)return;
    if(!document.hidden&&now-CENA.last>=48){CENA.last=now;cenaQuadro(now);}
    if(!RM)CENA.raf=requestAnimationFrame(f);};
  CENA.raf=requestAnimationFrame(f);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&CENA.cv&&!RM)cenaLoop();});
/* camada parada: céu, sol/lua, morros, marcos (casa de taipa, mandacaru, ipê seco) e chão */
function cenaEstatica(){
  const {W,H,hz,arena}=CENA,C=cenaCor(arena);
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(x|0,y|0,w==null?1:Math.max(0,w|0),h==null?1:Math.max(0,h|0));};
  // céu em faixas com pontilhado nas emendas
  const n=C.ceu.length,top=hz+6;
  for(let y=0;y<top;y++){const f=y/top*(n-1),i=Math.min(n-2,Math.floor(f)),k=f-i;
    R(C.ceu[i],0,y,W,1);if(k>0.5)for(let x=(y%2);x<W;x+=2)R(C.ceu[i+1],x,y,1,1);}
  if(arena===5||arena===3){for(let i=0;i<(arena===5?90:30);i++){const x=thsh(i,1,41)%W,y=thsh(i,2,41)%Math.max(1,hz-4);R(i%7?'#C8D0F0':'#FFFFFF',x,y);}}
  // sol / lua
  const astro=(cx,cy,r,c,c2)=>{for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const d=x*x+y*y;if(d<=r*r)R(d>(r-1)*(r-1)?c2:c,cx+x,cy+y);}};
  if(arena===1){const cx=Math.round(W*0.16),cy=Math.max(6,Math.round(hz*0.32));halo(g,cx,cy,22,'255,244,200',0.35);astro(cx,cy,5,'#FFF6C8','#FFE58A');}
  else if(arena===2){const cx=Math.round(W*0.78),cy=hz-3;halo(g,cx,cy,34,'255,190,110',0.45);astro(cx,cy,8,'#FFE08A','#FFB860');}
  else if(arena===3){const cx=Math.round(W*0.8),cy=Math.max(6,Math.round(hz*0.4));halo(g,cx,cy,16,'220,230,240',0.25);astro(cx,cy,4,'#EEF2F4','#C8D0D8');}
  else if(arena===5){const cx=Math.round(W*0.82),cy=Math.max(6,Math.round(hz*0.28));halo(g,cx,cy,20,'200,210,255',0.3);astro(cx,cy,5,'#F4F0DC','#D8D0B0');R('#D8D0B0',cx-2,cy-1,2,2);R('#D8D0B0',cx+1,cy+2,1,1);}
  // morros (3 camadas)
  const morro=(base,amp,fr,ph,c,hi)=>{for(let x=0;x<W;x++){const y=Math.round(base-amp*(0.6*Math.sin(x*fr+ph)+0.4*Math.sin(x*fr*2.3+ph*1.7)));R(c,x,y,1,H-y);if(hi)R(hi,x,y,1,1);}};
  morro(hz-2,5,0.045,1.3,C.m1,null);
  // marcos no morro do fundo
  const mx=Math.round(W*(arena===2?0.3:0.7));
  if(arena===1){celeiro(R,mx,hz-6);moinho(R,Math.round(W*0.38),hz-5);}
  else if(arena===2){for(let i=0;i<Math.ceil(W/14);i++){const x=i*14+(thsh(i,3,43)%5);arvore(R,x,hz-3-(thsh(i,4,43)%3),'#4E7A34','#6A9A3E','#C4362F');}}
  else if(arena===3){for(let i=0;i<Math.ceil(W/22);i++){const x=i*22+(thsh(i,5,43)%9);R('#2A3A38',x,hz-12,1,10);R('#2A3A38',x-2,hz-9,2,1);R('#2A3A38',x+1,hz-8,3,1);}}
  else if(arena===4){silo(R,mx,hz-4);}
  else if(arena===5){celeiro(R,Math.round(W*0.2),hz-6,true);}
  morro(hz+2,3,0.07,0.4,C.m2,null);
  morro(hz+6,2,0.11,2.2,C.m3,null);
  // lavoura em perspectiva (faixas que engrossam para baixo)
  let y=hz+7,k=0;
  while(y<H){const hh=Math.max(1,Math.round(1+(y-hz)*0.07));const c=C.lav[k%2];R(c,0,y,W,hh);
    if(k%2===0&&hh>=2)for(let x=(k*3)%5;x<W;x+=5+Math.round(hh/2))R(shade(c,1.25),x,y,1,1);
    y+=hh;k++;}
  if(arena===3){for(let yy=hz+8;yy<H;yy+=3)for(let x=(yy*7)%11;x<W;x+=9+(yy%5))R('#4A8A84',x,yy,3,1);}
  // escurece de baixo e dos lados (o tabuleiro e a mão ficam por cima, bem legíveis)
  const gr=g.createLinearGradient(0,hz,0,H);gr.addColorStop(0,'rgba(10,8,6,0)');gr.addColorStop(0.55,'rgba(10,8,6,.35)');gr.addColorStop(1,'rgba(10,8,6,.85)');g.fillStyle=gr;g.fillRect(0,hz,W,H-hz);
  const gl=g.createLinearGradient(0,0,W,0);gl.addColorStop(0,'rgba(10,8,6,.35)');gl.addColorStop(0.2,'rgba(10,8,6,0)');gl.addColorStop(0.8,'rgba(10,8,6,0)');gl.addColorStop(1,'rgba(10,8,6,.35)');g.fillStyle=gl;g.fillRect(0,0,W,H);
  return cv;
}
function halo(g,cx,cy,r,rgb,a){const gr=g.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,`rgba(${rgb},${a})`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.fillRect(cx-r,cy-r,r*2,r*2);}
/* v10: os nomes antigos ficam, o desenho é do tema: "celeiro" = casa de taipa, "moinho" = mandacaru, "silo" = ipê seco */
function celeiro(R,x,y,noite){const c=noite?'#2E2636':'#B07A4A',d=noite?'#1E1828':'#7A4A2A',t=noite?'#3A3046':'#A8844A';
  R(c,x,y-8,14,8);R(d,x+12,y-8,2,8);for(let j=0;j<5;j++)R(t,x-1+j,y-9-j,16-j*2,1);R('#2A1A10',x+5,y-5,3,5);R(noite?'#9C7FF0':'#FFC870',x+10,y-6,2,2);}
function moinho(R,x,y){const c='#3E6A2E';R(c,x,y-12,2,12);R('#6A9A44',x,y-12,1,12);R(c,x-3,y-7,3,1);R(c,x-3,y-10,1,3);R(c,x+2,y-8,3,1);R(c,x+4,y-11,1,3);}
function silo(R,x,y){const c='#1A1626';R(c,x,y-16,2,16);for(let i=1;i<6;i++){R(c,x-i,y-9-i,1,1);R(c,x+1+i,y-12-i,1,1);}R('#F2C230',x-3,y-12,1,1);R('#F2C230',x-1,y-12,1,1);}
function arvore(R,x,y,c,hi,fr){R('#4B2C17',x,y-3,1,4);for(let yy=-4;yy<=0;yy++)for(let xx=-3;xx<=3;xx++){if(xx*xx+yy*yy*1.6>11)continue;R(yy<-2?hi:c,x+xx,y-4+yy);}if(fr){R(fr,x-2,y-5);R(fr,x+1,y-7);R(fr,x+2,y-4);}}
/* itens animados por arena (nuvens, pássaros, vaga-lumes, chuva, fogos...) */
function cenaItens(){
  const {W,H,hz,arena}=CENA;const it={nuv:[],bichos:[],gotas:[],fogos:[]};
  const nn=arena===4?Math.ceil(W/16):Math.max(3,Math.ceil(W/45));
  for(let i=0;i<nn;i++)it.nuv.push({x:Math.random()*W,y:arena===4?Math.random()*hz*0.7:2+Math.random()*Math.max(4,hz*0.55),w:8+Math.floor(Math.random()*(arena===4?20:12)),v:(arena===4?1.6:0.6)+Math.random()*0.8});
  if(arena===3||arena===5)for(let i=0;i<Math.ceil(W*H/2600);i++)it.bichos.push({x:Math.random()*W,y:hz*0.5+Math.random()*(H-hz*0.5),f:Math.random()*6.28,s:0.3+Math.random()*0.5});
  if(arena===1||arena===2)for(let i=0;i<3;i++)it.bichos.push({x:Math.random()*W,y:3+Math.random()*Math.max(4,hz*0.6),f:Math.random()*6.28,s:2+Math.random()*2});
  if(arena===2)for(let i=0;i<Math.ceil(W*H/5000);i++)it.gotas.push({x:Math.random()*W,y:Math.random()*H,v:0.4+Math.random()*0.5,f:Math.random()*6.28});
  if(arena===4)for(let i=0;i<Math.ceil(W*H/900);i++)it.gotas.push({x:Math.random()*W,y:Math.random()*H,v:5+Math.random()*3});
  return it;
}
function cenaQuadro(now,forcar){
  const g=CENA.g;if(!g||!CENA.cv)return;
  if(!CENA.est)CENA.est=cenaEstatica();
  if(!CENA.itens)CENA.itens=cenaItens();
  const {W,H,hz,arena}=CENA,C=cenaCor(arena),it=CENA.itens;
  const t=RM?0:(now-CENA.t0)/1000;
  g.imageSmoothingEnabled=false;g.globalAlpha=1;g.globalCompositeOperation='source-over';
  g.drawImage(CENA.est,0,0);
  const R=(c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w==null?1:w,h==null?1:h);};
  // nuvens
  for(const n of it.nuv){const x=((n.x+t*n.v)%(W+n.w*2))-n.w,y=n.y;
    R(C.nuvs,x+1,y+3,n.w-2,1);R(C.nuv,x,y+1,n.w,2);R(C.nuv,x+2,y,n.w-5,1);R(C.nuv,x+Math.round(n.w*0.4),y-1,Math.round(n.w*0.35),1);}
  // névoa (brejo)
  if(arena===3){g.globalAlpha=0.18;for(let k=0;k<4;k++){const y=hz-6+k*9,x=((t*(3+k))%(W+60))-60;R('#C8D4DC',x,y,60,3);R('#C8D4DC',x+W*0.55,y+4,50,2);}g.globalAlpha=1;}
  // bandeirinhas de festa junina e lanternas (festa)
  if(arena===5){const cores=['#E8693A','#F2C230','#5DBB63','#4C9BE8','#E0565B','#B36BE8'];
    for(let L=0;L<2;L++){const y0=4+L*Math.max(8,Math.round(hz*0.35)),sag=5;
      for(let x=0;x<W;x++){const y=y0+Math.round(sag*Math.sin(Math.PI*((x%60)/60)));R('#3A2E40',x,y);
        if(x%5===0){const sw=Math.round(Math.sin(t*2+x*0.3)*0.6);R(cores[(x/5+L)%cores.length],x-1+sw,y+1,3,2);R(cores[(x/5+L)%cores.length],x+sw,y+3,1,1);}}}
    for(let i=0;i<4;i++){const x=Math.round(W*(0.12+i*0.25)),y=hz-2;const a=0.5+0.2*Math.sin(t*3+i);g.globalAlpha=a;halo(g,x,y,7,'255,180,90',0.7);g.globalAlpha=1;R('#FFC860',x,y-1,2,2);}
    // fogos de artifício de vez em quando
    if(!RM&&Math.random()<0.012&&it.fogos.length<3)it.fogos.push({x:W*(0.15+Math.random()*0.7),y:3+Math.random()*Math.max(4,hz*0.6),t0:t,c:cores[Math.floor(Math.random()*cores.length)]});
    for(let i=it.fogos.length-1;i>=0;i--){const f=it.fogos[i],k=(t-f.t0)/1.2;if(k>1){it.fogos.splice(i,1);continue;}
      const r=2+k*9;g.globalAlpha=1-k;for(let a=0;a<12;a++){const an=a/12*6.283;R(a%2?f.c:'#FFF4C0',f.x+Math.cos(an)*r,f.y+Math.sin(an)*r+k*k*3);}g.globalAlpha=1;}
  }
  // estrelas piscando
  if(arena===5&&!RM){for(let i=0;i<10;i++){const x=thsh(i,9,47)%W,y=thsh(i,8,47)%Math.max(1,hz-4);if(Math.sin(t*2.3+i*1.7)>0.6)R('#FFFFFF',x,y);}}
  // pássaros (manhã e tarde)
  if(arena===1||arena===2){for(const b of it.bichos){const x=((b.x+t*b.s*4)%(W+20))-10,y=b.y+Math.sin(t*0.8+b.f)*2,asa=Math.sin(t*9+b.f)>0;
    R('#2A2A3A',x,y);R('#2A2A3A',x-1,y-(asa?1:0));R('#2A2A3A',x+1,y-(asa?1:0));R('#2A2A3A',x-2,y-(asa?2:-1));R('#2A2A3A',x+2,y-(asa?2:-1));}}
  // vaga-lumes (brejo e festa)
  if(arena===3||arena===5){for(const f of it.bichos){const x=(f.x+Math.sin(t*f.s+f.f)*6+W)%W,y=f.y+Math.cos(t*f.s*0.8+f.f)*4,a=0.5+0.5*Math.sin(t*3+f.f*3);
    if(a<0.25)continue;g.globalAlpha=a*0.5;R('#E8FF8A',x-1,y,3,1);R('#E8FF8A',x,y-1,1,3);g.globalAlpha=a;R('#FFFFC8',x,y);g.globalAlpha=1;}}
  // pólen e pétalas (pomar)
  if(arena===2){for(const p of it.gotas){const y=(p.y+t*p.v*3)%H,x=(p.x+Math.sin(t+p.f)*4+W)%W;R(p.f>3?'#FFE4F0':'#FFE58A',x,y);}}
  // chuva e relâmpago (silo)
  if(arena===4){g.globalAlpha=0.55;for(const d of it.gotas){const y=(d.y+t*d.v*12)%H,x=(d.x-t*d.v*3+W*4)%W;R('#9AAAB8',x,y,1,3);}g.globalAlpha=1;
    if(!RM){if(CENA.raio<=0&&Math.random()<0.006)CENA.raio=6;if(CENA.raio>0){g.globalAlpha=CENA.raio%3===0?0.35:0.12;R('#E8F0FF',0,0,W,hz+10);g.globalAlpha=1;CENA.raio--;}}}
  // brilho do sol pulsando (manhã e tarde)
  if((arena===1||arena===2)&&!RM){const cx=Math.round(W*(arena===1?0.16:0.78)),cy=arena===1?Math.max(6,Math.round(hz*0.32)):hz-3;g.globalAlpha=0.12+0.06*Math.sin(t*1.3);halo(g,cx,cy,arena===1?34:46,arena===1?'255,244,200':'255,190,110',1);g.globalAlpha=1;}
  // capim da beira balançando (na frente)
  const base=H-1;for(let x=0;x<W;x+=3){const h=3+(thsh(x,1,53)%4),sw=RM?0:Math.round(Math.sin(t*1.6+x*0.25)*1);R(arena>=3?'#1E2E1A':'#2A4A22',x+sw,base-h,1,h);}
}
window.addEventListener('resize',()=>{if(CENA.cv){cenaMedir();cenaQuadro(performance.now(),true);}});

/* ===================== personagens do tabuleiro (v6) =====================
   Na mão e nos menus a carta continua carta; no campo ela vira o PERSONAGEM (ver SPRITES.md).
   window.CHAR_SPRITE[id](g,t,st,p) desenha num canvas 64x64 transparente (pés em y=60).
   Um único requestAnimationFrame (~30 fps) redesenha todos os personagens do campo, cada um com o seu
   próprio deslocamento de tempo (não andam em sincronia). Estados: 'idle' | 'sono' (laços) e
   'atk' | 'hit' | 'entra' (uma vez, p 0..1, dirigidos pelas animações em 35-fx.js).
   O canvas de cada personagem é reaproveitado pela chave (uid): redesenhar o tabuleiro não reinicia nada. */
const SPR={u:new Map(),raf:0,last:0};
const SPR_DT=1000/30;
/* fallback: a arte da carta num medalhão redondo, com balanço (o jogo nunca quebra sem o sprite) */
function sprMedalhao(id){
  return function(g,t,st,p,E){
    const c=CARD[id];const rar=c?c.rar:'comum';
    const ring=(typeof RAR_COR!=='undefined'&&RAR_COR[rar])||'#9A9488';
    // a arte da carta é cara: atualiza a ~8 quadros por segundo
    if(!E.art){E.art=document.createElement('canvas');E.art.width=64;E.art.height=48;E.artT=-1;}
    if(E.artT<0){medalhaoPintar(E.art.getContext('2d'),id,{semNome:true});E.artT=0;}
    let dy=Math.round(Math.sin(t*2.2)*1.5),sc=1,lean=0,flash=0,dark=0;
    if(st==='sono'){dy=Math.round(Math.sin(t*1.1)*1)+1;dark=0.32;}
    else if(st==='atk'){const k=p<0.35?p/0.35:p<0.55?1:1-(p-0.55)/0.45;sc=1+0.12*k;lean=(p<0.35?-2*k:4*k);dy=-Math.round(3*k);}
    else if(st==='hit'){const k=1-p;flash=k*0.8;dy=Math.round(k*2);lean=Math.round(Math.sin(p*20)*2*k);}
    else if(st==='entra'){const e=p<0.6?p/0.6:1;sc=p<0.6?0.2+1.0*e:1.2-0.2*((p-0.6)/0.4);dy=Math.round((1-e)*6);}
    const cx=32+lean,cy=39+dy,R0=Math.max(4,Math.round(19*sc));
    g.imageSmoothingEnabled=false;
    g.fillStyle='#1A1420';g.beginPath();g.arc(cx,cy,R0+2,0,6.2832);g.fill();
    g.fillStyle=ring;g.beginPath();g.arc(cx,cy,R0+1,0,6.2832);g.fill();
    g.fillStyle='#FFFFFF';g.globalAlpha=0.35;g.fillRect(cx-Math.round(R0*0.5),cy-R0,Math.round(R0),1);g.globalAlpha=1;
    g.save();g.beginPath();g.arc(cx,cy,R0-1,0,6.2832);g.clip();
    const s=(R0-1)*2/38;g.drawImage(E.art,13,5,38,38,cx-(R0-1),cy-(R0-1),38*s,38*s);
    if(dark){g.fillStyle='rgba(16,20,48,'+dark+')';g.fillRect(0,0,64,64);}
    if(flash){g.fillStyle='rgba(255,255,255,'+flash.toFixed(2)+')';g.fillRect(0,0,64,64);}
    g.restore();
    g.fillStyle='#1A1420';g.fillRect(cx-6,cy+R0+1,12,2);
  };
}
/* v10: os sprites em pixel do v7 são bichos de fazenda: fora do tema. Só voltam com window.__SPR_FAZENDA (depuração). */
const sprFonte=()=>window.__SPR_FAZENDA?window.CHAR_SPRITE:null;
function spriteDe(id){const S=sprFonte();const f=S&&S[id];return typeof f==='function'?f:sprMedalhao(id);}
/* põe o canvas do personagem no elemento (reaproveita o canvas antigo do mesmo uid, se existir) */
function sprMontar(el,id,key){
  if(!el)return null;
  const novo=el.querySelector('canvas.spr');if(!novo)return null;
  let E=SPR.u.get(String(key));
  if(E&&E.id===id&&E.cv!==novo){novo.replaceWith(E.cv);}
  else if(!E||E.id!==id){E={cv:novo,g:novo.getContext('2d'),id,off:Math.random()*20,sono:false,act:null,fb:null,f:null};SPR.u.set(String(key),E);}
  E.perdido=0;sprDesenhar(E,performance.now());sprKick();
  return E;
}
function sprEntrada(key){return SPR.u.get(String(key))||null;}
function sprDe(el){if(!el)return null;const cv=el.matches&&el.matches('canvas.spr')?el:el.querySelector&&el.querySelector('canvas.spr');if(!cv)return null;for(const E of SPR.u.values())if(E.cv===cv)return E;return null;}
function sprEstado(key,o){const E=SPR.u.get(String(key));if(!E)return;let mudou=false;for(const k in o)if(E[k]!==o[k]){E[k]=o[k];mudou=true;}if(mudou&&RM)sprDesenhar(E,performance.now());}
/* ação de uma vez: kf = [[ms,p],...] (p seguindo a animação) ou só dur (p linear 0..1) */
function sprAcao(alvo,st,dur,kf){
  const E=typeof alvo==='object'&&alvo&&alvo.nodeType?sprDe(alvo):SPR.u.get(String(alvo));if(!E)return;
  E.act={st,t0:performance.now(),dur:Math.max(1,dur),kf:kf||null};
  if(RM){E.act=null;sprDesenhar(E,performance.now());return;}
  sprKick();
}
function sprP(a,now){
  const ms=now-a.t0;if(!a.kf)return Math.min(1,ms/a.dur);
  const kf=a.kf;if(ms<=kf[0][0])return kf[0][1];
  for(let i=1;i<kf.length;i++)if(ms<=kf[i][0]){const [t0,p0]=kf[i-1],[t1,p1]=kf[i];return p0+(p1-p0)*((ms-t0)/Math.max(1,t1-t0));}
  return kf[kf.length-1][1];
}
function sprDesenhar(E,now){
  const g=E.g;if(!g)return;
  if(typeof P3D!=='undefined'&&P3D.on)return; // v8: no 3D o personagem é o modelo (o canvas fica vazio e escondido)
  let st=E.sono?'sono':'idle',p=0;
  if(E.act&&!RM){const fim=E.act.kf?E.act.kf[E.act.kf.length-1][0]:E.act.dur;if(now-E.act.t0>=fim)E.act=null;else{st=E.act.st;p=Math.max(0,Math.min(1,sprP(E.act,now)));}}
  if(E.congelado)return;
  const t=RM?0:now/1000+E.off;
  try{g.setTransform(1,0,0,1,0,0);}catch(e){}
  g.globalAlpha=1;g.globalCompositeOperation='source-over';g.imageSmoothingEnabled=false;g.clearRect(0,0,64,64);
  if(!E.f){const S=sprFonte();E.f=S&&typeof S[E.id]==='function'?S[E.id]:null;if(!E.f)E.fb=E.fb||sprMedalhao(E.id);}
  if(E.f){
    try{g.save();E.f(g,t,st,p);g.restore();return;}
    catch(e){try{g.restore();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.clearRect(0,0,64,64);}catch(_){}E.f=null;E.fb=sprMedalhao(E.id);}
  }
  try{g.save();E.fb(g,t,st,p,E);g.restore();}catch(e){try{g.restore();}catch(_){}}
}
function sprKick(){if(SPR.raf||RM||document.hidden||(typeof P3D!=='undefined'&&P3D.on))return;SPR.raf=requestAnimationFrame(sprLoop);}
function sprLoop(now){
  SPR.raf=0;
  if(RM||document.hidden)return;
  const bt=document.getElementById('battle');if(!bt||bt.hidden){return;}
  if(now-SPR.last>=SPR_DT-4){
    SPR.last=now;
    for(const [k,E] of SPR.u){
      if(!E.cv.isConnected){E.perdido=(E.perdido||0)+1;if(E.perdido>90)SPR.u.delete(k);continue;} // ~3 s fora do DOM: esquece
      E.perdido=0;sprDesenhar(E,now);
    }
  }
  // v7: o cenário da batalha (58-palco.js) anda no mesmo laço
  const palco=typeof palcoAtivo==='function'&&palcoAtivo();
  if(palco)palcoTique(now);
  if(SPR.u.size||palco)SPR.raf=requestAnimationFrame(sprLoop);
}
function sprParar(){if(SPR.raf)cancelAnimationFrame(SPR.raf);SPR.raf=0;SPR.u.clear();}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sprKick();});
/* artistas podem chegar depois (arquivos art-s..w): troca o medalhão pelo sprite assim que existir */
function sprRever(){for(const E of SPR.u.values()){const S=sprFonte();if(!E.f&&S&&typeof S[E.id]==='function'){E.f=S[E.id];}}}

