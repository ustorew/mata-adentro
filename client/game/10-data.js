/* ===================== DADOS ===================== */
const KEY='cartas-grao-v1';
const RARS=['comum','incomum','rara','epica','lendaria'];
const RAR_NOME={comum:'Comum',incomum:'Incomum',rara:'Rara',epica:'Épica',lendaria:'Lendária'};
const RAR_COR={comum:'#9A9488',incomum:'#5DBB63',rara:'#4C9BE8',epica:'#B36BE8',lendaria:'#F2BE4A'};
const RAR_LUZ={comum:'#FFFFFF',incomum:'#7FE07F',rara:'#5FB0FF',epica:'#C88BFF',lendaria:'#FFD35A'};
const TERRS=['milharal','pomar','brejo','pasto'];
const TERR_NOME={milharal:'Milharal',pomar:'Pomar',brejo:'Brejo',pasto:'Pasto',neutro:'Celeiro'};
const TERR_COR={milharal:'#E8B23A',pomar:'#E0565B',brejo:'#3BA39A',pasto:'#6CB843',neutro:'#A87A4E'};
const TIPO_NOME={criatura:'Criatura',feitico:'Feitiço',construcao:'Construção'};

/* cartas: custo, atk/hp, kw, alvo, n (por nível), fx */
const CARDS=[
 // ---- Milharal ----
 {id:'espiga-sapeca',nome:'Espiga Sapeca',tipo:'criatura',terreno:'milharal',rar:'comum',custo:1,atk:2,hp:1,kw:{furia:1},texto:'Fúria.',sabor:'Pulou do pé antes de ficar madura.'},
 {id:'corvo-ladino',nome:'Corvo Ladino',tipo:'criatura',terreno:'milharal',rar:'comum',custo:2,atk:2,hp:1,kw:{voar:1},texto:'Voar.',sabor:'Não existe espantalho que dê conta dele.'},
 {id:'chuva-de-graos',nome:'Chuva de Grãos',tipo:'feitico',terreno:'milharal',rar:'comum',custo:2,alvo:'rival',n:[3,3,4,4,5],fx:[{on:'feitico',op:'danoCriatura'}],texto:'Causa {n} de dano a uma criatura rival.',sabor:'Quando o céu resolve pagar em grão.',nLabel:'Dano'},
 {id:'espantalho-guardiao',nome:'Espantalho Guardião',tipo:'criatura',terreno:'milharal',rar:'incomum',custo:3,atk:1,hp:5,kw:{bloqueiaVoo:1},texto:'Bloqueia criaturas com Voar.',sabor:'Fica de pé a noite toda. Não reclama.'},
 {id:'vento-dourado',nome:'Vento Dourado',tipo:'feitico',terreno:'milharal',rar:'incomum',custo:3,alvo:null,n:[1,1,2,2,2],fx:[{on:'feitico',op:'buffTimeTemp'}],texto:'Suas criaturas ganham +{n} ATK neste turno e podem atacar mesmo se entraram agora.',sabor:'O vento do meio-dia acorda até quem chegou agora.',nLabel:'ATK extra'},
 {id:'pipoqueiro-explosivo',nome:'Pipoqueiro Explosivo',tipo:'criatura',terreno:'milharal',rar:'rara',custo:4,atk:3,hp:3,kw:{furia:1},fx:[{on:'morrer',op:'danoHeroiRival',v:3}],texto:'Fúria. Ao morrer: causa 3 de dano ao herói rival.',sabor:'Pof! Pof! POF!'},
 {id:'revoada-noturna',nome:'Revoada Noturna',tipo:'criatura',terreno:'milharal',rar:'epica',custo:5,atk:3,hp:3,kw:{voar:1,furia:1},fx:[{on:'entrar',op:'danoTodasRivais',v:1}],texto:'Voar. Fúria. Ao entrar: causa 1 de dano a cada criatura rival.',sabor:'Quando escurece, o milharal tem dono.'},
 {id:'rei-milhao',nome:'Rei Milhão',tipo:'criatura',terreno:'milharal',rar:'lendaria',custo:7,atk:6,hp:6,kw:{furia:1},fx:[{on:'entrar',op:'buffOutrasTemp',v:1}],texto:'Fúria. Ao entrar: suas outras criaturas ganham +1 ATK neste turno e podem atacar mesmo se entraram agora.',sabor:'Cada grão do campo conhece seu nome.'},
 // ---- Milharal (v4) ----
 {id:'codorna-ninheira',nome:'Codorna Ninheira',curto:'Codorna',tipo:'criatura',terreno:'milharal',rar:'comum',custo:2,atk:1,hp:1,familia:'aves',golpe:'bicada',arena:1,art:'C',v4:1,fx:[{on:'entrar',op:'criaFicha',ficha:'filhote',n:1,ninhada:1}],texto:'Ninhada: 1 Filhote 1/1 com Fúria.',sabor:'Choca de dia, conta história de noite.'},
 {id:'pamonha-quentinha',nome:'Pamonha Quentinha',curto:'Pamonha',tipo:'feitico',terreno:'milharal',rar:'comum',custo:1,alvo:'aliada',n:[1,1,2,2,2],golpe:'estouro',arena:1,art:'C',v4:1,fx:[{on:'feitico',op:'buffAliadaTemp'}],texto:'Uma criatura sua acorda e ganha +{n} ATK neste turno.',sabor:'Saiu da panela direto pra briga.',nLabel:'ATK extra'},
 {id:'galo-despertador',nome:'Galo Despertador',curto:'Galo',tipo:'criatura',terreno:'milharal',rar:'incomum',custo:3,atk:1,hp:2,familia:'aves',golpe:'bicada',arena:2,art:'C',v4:1,fx:[{on:'entrar',op:'acordaOutras',grito:1}],texto:'Grito: suas outras criaturas acordam.',sabor:'Cocoricó! Ninguém dorme no ponto.'},
 {id:'galinheiro',nome:'Galinheiro',curto:'Galinheiro',tipo:'construcao',terreno:'milharal',rar:'rara',custo:3,n:[1,1,1,2,2],arena:4,art:'C',v4:1,fx:[{on:'inicio',op:'inicioNinhada',ficha:'filhote'}],texto:'No início do seu turno: se este terreno estiver vazio, nasce nele um Filhote {n}/1 com Fúria.',sabor:'Sempre cabe mais um.',nLabel:'ATK do Filhote'},
 {id:'gaviao-real',nome:'Gavião Real',curto:'Gavião',tipo:'criatura',terreno:'milharal',rar:'lendaria',custo:7,atk:5,hp:5,kw:{voar:1},familia:'aves',golpe:'garra',arena:5,art:'C',v4:1,fx:[{on:'entrar',op:'danoMaiorAtk',v:3}],texto:'Voar. Ao entrar: causa 3 de dano à criatura rival com mais ATK.',sabor:'Quando a sombra dele passa, o milharal fica quieto.'},
 // ---- Pomar ----
 {id:'maca-rolica',nome:'Maçã Roliça',tipo:'criatura',terreno:'pomar',rar:'comum',custo:1,atk:1,hp:2,kw:{brotar:1},texto:'Brotar.',sabor:'Cresce um pouquinho a cada manhã.'},
 {id:'abelha-operaria',nome:'Abelha Operária',tipo:'criatura',terreno:'pomar',rar:'comum',custo:2,atk:1,hp:2,kw:{voar:1},fx:[{on:'entrar',op:'curaHeroi',v:2}],texto:'Voar. Ao entrar: cura 2 do seu herói.',sabor:'Trabalha cantando. Às vezes, até afinada.'},
 {id:'orvalho-da-manha',nome:'Orvalho da Manhã',tipo:'feitico',terreno:'pomar',rar:'comum',custo:1,alvo:'aliada',n:[1,1,2,2,3],fx:[{on:'feitico',op:'buffAliada',a:1}],texto:'Uma criatura sua ganha +1/+{n}.',sabor:'Uma gota de manhã vale um dia inteiro.',nLabel:'Vida extra'},
 {id:'cerejas-gemeas',nome:'Cerejas Gêmeas',curto:'Cerejas',tipo:'criatura',terreno:'pomar',rar:'incomum',custo:3,atk:2,hp:2,fx:[{on:'entrar',op:'criaFicha',ficha:'cereja',n:1,ninhada:1}],texto:'Ninhada: 1 Cereja 1/1.',sabor:'Onde vai uma, vai a outra.'},
 {id:'joaninha-curandeira',nome:'Joaninha Curandeira',tipo:'criatura',terreno:'pomar',rar:'incomum',custo:2,atk:1,hp:3,fx:[{on:'inicio',op:'curaAliadas',v:1}],texto:'No início do seu turno: cura 1 de vida de todas as suas criaturas.',sabor:'Sete pintinhas, sete curativos.'},
 {id:'colmeia-dourada',nome:'Colmeia Dourada',curto:'Colmeia',tipo:'construcao',terreno:'pomar',rar:'rara',custo:3,n:[1,1,2,2,2],fx:[{on:'inicio',op:'inicioBuffLane'}],texto:'No início do seu turno: a criatura deste terreno ganha +1/+{n}.',sabor:'Doce é o trabalho de muitas.',nLabel:'Vida extra'},
 {id:'macieira-ancia',nome:'Macieira Anciã',tipo:'criatura',terreno:'pomar',rar:'epica',custo:6,atk:4,hp:8,kw:{brotar:1},fx:[{on:'passivo',op:'brotarAura'}],texto:'Brotar. Suas outras criaturas também têm Brotar (enquanto ela estiver em campo).',sabor:'Plantada pela avó da avó de alguém.'},
 {id:'guardia-florada',nome:'Guardiã Florada',tipo:'criatura',terreno:'pomar',rar:'lendaria',custo:6,atk:5,hp:5,kw:{brotar:1},fx:[{on:'entrar',op:'curaHeroi',v:5},{on:'entrar',op:'curaTotalAliadas'}],texto:'Brotar. Ao entrar: cura 5 do seu herói e cura toda a vida das suas criaturas.',sabor:'Quando ela passa, até galho seco floresce.'},
 // ---- Pomar (v4) ----
 {id:'pe-de-maracuja',nome:'Pé de Maracujá',curto:'Maracujá',tipo:'criatura',terreno:'pomar',rar:'comum',custo:2,atk:1,hp:3,kw:{brotar:1},familia:'roca',golpe:'chicote',arena:2,art:'D',v4:1,fx:[{on:'passivo',op:'brotarVizinhas'}],texto:'Brotar. Suas criaturas vizinhas também têm Brotar.',sabor:'Sobe pela cerca e leva todo mundo junto.'},
 {id:'formiga-carregadeira',nome:'Formiga Carregadeira',curto:'Formiga',tipo:'criatura',terreno:'pomar',rar:'comum',custo:1,atk:1,hp:2,familia:'bichinhos',golpe:'mordida',arena:2,art:'D',v4:1,fx:[{on:'entrar',op:'buffVizinhas',a:0,h:2}],texto:'Ao entrar: suas criaturas vizinhas ganham +0/+2.',sabor:'Carrega dez vezes o próprio peso. E ainda reclama pouco.'},
 {id:'cipo-enrolado',nome:'Cipó Enrolado',curto:'Cipó',tipo:'feitico',terreno:'pomar',rar:'incomum',custo:2,alvo:'rival',n:[1,1,2,2,3],golpe:'chicote',arena:2,art:'D',v4:1,fx:[{on:'feitico',op:'danoEnraiza'}],texto:'Causa {n} de dano a uma criatura rival e a deixa Enraizada.',sabor:'Quem pisa no pomar sem licença fica por lá.',nLabel:'Dano'},
 {id:'louva-a-deus',nome:'Louva-a-Deus',curto:'Louva-a-Deus',tipo:'criatura',terreno:'pomar',rar:'incomum',custo:3,atk:3,hp:2,familia:'bichinhos',golpe:'garra',arena:2,art:'D',v4:1,fx:[{on:'entrar',op:'danoFrente',v:2}],texto:'Ao entrar: causa 2 de dano à criatura da frente.',sabor:'Parece que está rezando. Está mirando.'},
 {id:'abelha-rainha',nome:'Abelha Rainha',curto:'Rainha',tipo:'criatura',terreno:'pomar',rar:'epica',custo:5,atk:4,hp:4,kw:{voar:1},familia:'bichinhos',golpe:'ferrao',arena:5,art:'D',v4:1,fx:[{on:'entrar',op:'criaFicha',ficha:'zangao',n:2,ninhada:1}],texto:'Voar. Ninhada: 2 Zangões 1/1 com Voar.',sabor:'Uma palavra dela e a colmeia inteira levanta voo.'},
 // ---- Neutro (A) ----
 {id:'pintinho-valente',nome:'Pintinho Valente',tipo:'criatura',terreno:'neutro',rar:'comum',custo:1,atk:1,hp:2,kw:{furia:1},texto:'Fúria.',sabor:'Pequeno no tamanho, gigante na coragem.'},
 {id:'adubo-magico',nome:'Adubo Mágico',tipo:'feitico',terreno:'neutro',rar:'incomum',custo:2,alvo:'aliada',n:[2,2,2,3,3],fx:[{on:'feitico',op:'buffAliada',h:2}],texto:'Uma criatura sua ganha +{n}/+2.',sabor:'Cheiro ruim, resultado ótimo.',nLabel:'ATK extra'},
 // ---- Brejo ----
 {id:'sapinho-verruguento',nome:'Sapinho Verruguento',tipo:'criatura',terreno:'brejo',rar:'comum',custo:1,atk:1,hp:2,kw:{espinhos:1},texto:'Espinhos 1.',sabor:'Quem morde, se arrepende.'},
 {id:'libelula-faisca',nome:'Libélula Faísca',tipo:'criatura',terreno:'brejo',rar:'comum',custo:1,atk:1,hp:1,kw:{voar:1,furia:1},texto:'Voar. Fúria.',sabor:'Já foi e já voltou.'},
 {id:'lodo-pegajoso',nome:'Lodo Pegajoso',tipo:'feitico',terreno:'brejo',rar:'comum',custo:1,alvo:'rival',n:[2,2,2,3,3],fx:[{on:'feitico',op:'perdeAtk'}],texto:'Uma criatura rival perde {n} de ATK para sempre (mínimo 0).',sabor:'Pisou, grudou.',nLabel:'ATK a menos'},
 {id:'taboa-espinhosa',nome:'Taboa Espinhosa',tipo:'criatura',terreno:'brejo',rar:'incomum',custo:2,atk:0,hp:4,kw:{espinhos:2},texto:'Espinhos 2.',sabor:'Bonita de longe. De perto também, mas dói.'},
 {id:'garca-pescadora',nome:'Garça Pescadora',tipo:'criatura',terreno:'brejo',rar:'incomum',custo:4,atk:3,hp:3,kw:{voar:1},fx:[{on:'entrar',op:'danoFrente',v:2}],texto:'Voar. Ao entrar: causa 2 de dano à criatura da frente.',sabor:'Paciência de pedra, bico de flecha.'},
 {id:'atoleiro',nome:'Atoleiro',tipo:'feitico',terreno:'brejo',rar:'rara',custo:4,alvo:'rival',n:[3,3,4,4,5],fx:[{on:'feitico',op:'destroiSeVidaAte'}],texto:'Destrói uma criatura rival com {n} ou menos de vida.',sabor:'O brejo guarda tudo o que engole.',nLabel:'Vida máxima do alvo'},
 {id:'rainha-das-ras',nome:'Rainha das Rãs',tipo:'criatura',terreno:'brejo',rar:'epica',custo:5,atk:4,hp:5,kw:{espinhos:2},fx:[{on:'entrar',op:'espinhosOutras',v:1}],texto:'Espinhos 2. Ao entrar: suas outras criaturas em campo ganham +1 de Espinhos.',sabor:'Quando ela canta, o brejo inteiro responde.'},
 {id:'velho-lodao',nome:'Velho Lodão',tipo:'criatura',terreno:'brejo',rar:'lendaria',custo:7,atk:6,hp:7,kw:{espinhos:2},fx:[{on:'entrar',op:'destroiFrente'}],texto:'Espinhos 2. Ao entrar: destrói a criatura da frente.',sabor:'Dorme cem anos. Acorda com fome.'},
 // ---- Brejo (v4) ----
 {id:'perereca-grudenta',nome:'Perereca Grudenta',curto:'Perereca',tipo:'criatura',terreno:'brejo',rar:'comum',custo:1,atk:1,hp:1,familia:'brejeiros',golpe:'chicote',arena:3,art:'E',v4:1,fx:[{on:'entrar',op:'perdeAtkFrente',v:1}],texto:'Ao entrar: a criatura da frente perde 1 de ATK para sempre.',sabor:'Gruda primeiro, pergunta depois.'},
 {id:'vaga-lume-piscante',nome:'Vaga-lume Piscante',curto:'Vaga-lume',tipo:'criatura',terreno:'brejo',rar:'comum',custo:2,atk:1,hp:2,kw:{voar:1,espinhos:1},familia:'bichinhos',golpe:'raio',arena:3,art:'D',v4:1,texto:'Voar. Espinhos 1.',sabor:'Pisca, pisca... e queima o dedo de quem pega.'},
 {id:'sapo-cururu',nome:'Sapo-Cururu',curto:'Cururu',tipo:'criatura',terreno:'brejo',rar:'incomum',custo:3,atk:2,hp:3,kw:{espinhos:1},familia:'brejeiros',golpe:'respingo',arena:3,art:'E',v4:1,fx:[{on:'entrar',op:'criaFicha',ficha:'girino',n:1,ninhada:1}],texto:'Espinhos 1. Ninhada: 1 Girino 1/1 com Espinhos 1.',sabor:'Canta na beira do rio e todo girino vem ver.'},
 {id:'cagado-ranzinza',nome:'Cágado Ranzinza',curto:'Cágado',tipo:'criatura',terreno:'brejo',rar:'rara',custo:3,atk:2,hp:5,kw:{couraca:2},familia:'brejeiros',golpe:'mordida',arena:3,art:'E',v4:1,fx:[{on:'entrar',op:'kwVizinhas',kw:'couraca',v:1}],texto:'Couraça 2. Ao entrar: suas criaturas vizinhas ganham Couraça 1.',sabor:'Cem anos de idade, cem anos de mau humor.'},
 {id:'sucuri-do-charco',nome:'Sucuri do Charco',curto:'Sucuri',tipo:'criatura',terreno:'brejo',rar:'epica',custo:6,atk:5,hp:7,familia:'brejeiros',golpe:'chicote',arena:5,art:'D',v4:1,fx:[{on:'entrar',op:'enraizaFrente',viz:1}],texto:'Ao entrar: a criatura da frente e as vizinhas dela ficam Enraizadas.',sabor:'Abraço de sucuri ninguém esquece.'},
 // ---- Pasto ----
 {id:'ovelha-felpuda',nome:'Ovelha Felpuda',tipo:'criatura',terreno:'pasto',rar:'comum',custo:2,atk:1,hp:4,texto:'',sabor:'Toda pancada vira cócega na lã.'},
 {id:'cabrito-teimoso',nome:'Cabrito Teimoso',tipo:'criatura',terreno:'pasto',rar:'comum',custo:2,atk:2,hp:3,kw:{pisotear:1},texto:'Pisotear.',sabor:'Se disserem não, ele ouve sim.'},
 {id:'feno-fresquinho',nome:'Feno Fresquinho',tipo:'feitico',terreno:'pasto',rar:'comum',custo:2,alvo:'aliada',n:[2,2,3,3,4],fx:[{on:'feitico',op:'vidaMaisCuraTotal'}],texto:'Uma criatura sua ganha +0/+{n} e cura toda a vida.',sabor:'Recarga completa, sabor capim.',nLabel:'Vida extra'},
 {id:'vaca-mimosa',nome:'Vaca Mimosa',tipo:'criatura',terreno:'pasto',rar:'incomum',custo:4,atk:2,hp:7,fx:[{on:'inicio',op:'curaHeroi',v:2}],texto:'No início do seu turno: cura 2 do seu herói.',sabor:'Leite morno e coração mole.'},
 {id:'bode-marrento',nome:'Bode Marrento',tipo:'criatura',terreno:'pasto',rar:'incomum',custo:4,atk:4,hp:4,kw:{pisotear:1},texto:'Pisotear.',sabor:'Ninguém sabe a idade dele. Ninguém pergunta.'},
 {id:'cerca-de-pedra',nome:'Cerca de Pedra',curto:'Cerca',tipo:'construcao',terreno:'pasto',rar:'rara',custo:2,n:[1,1,2,2,2],fx:[{on:'passivo',op:'reduzDanoLane'}],texto:'A criatura deste terreno recebe {n} de dano a menos de cada ataque.',sabor:'Pedra sobre pedra, ninguém passa.',nLabel:'Dano a menos'},
 {id:'touro-trovao',nome:'Touro Trovão',tipo:'criatura',terreno:'pasto',rar:'epica',custo:6,atk:4,hp:6,kw:{ataqueDuplo:1},texto:'Ataca duas vezes.',sabor:'Quando ele corre, o céu ronca junto.'},
 {id:'matriarca-mugidora',nome:'Matriarca Mugidora',tipo:'criatura',terreno:'pasto',rar:'lendaria',custo:7,atk:5,hp:9,kw:{pisotear:1},fx:[{on:'entrar',op:'buffOutras',a:2,h:2}],texto:'Pisotear. Ao entrar: suas outras criaturas ganham +2/+2.',sabor:'Um mugido dela e o rebanho inteiro se levanta.'},
 // ---- Pasto (v4) ----
 {id:'bezerro-manhoso',nome:'Bezerro Manhoso',curto:'Bezerro',tipo:'criatura',terreno:'pasto',rar:'comum',custo:2,atk:1,hp:3,familia:'rebanho',golpe:'chifrada',arena:1,art:'E',v4:1,fx:[{on:'entrar',op:'buffSeFamiliaVizinha',fam:'rebanho',a:1,h:1}],texto:'Ao entrar: ganha +1/+1 se tiver uma criatura do Rebanho vizinha.',sabor:'Perto da mãe, vira valente.'},
 {id:'jegue-carregador',nome:'Jegue Carregador',curto:'Jegue',tipo:'criatura',terreno:'pasto',rar:'comum',custo:3,atk:2,hp:2,familia:'rebanho',golpe:'pisao',arena:1,art:'E',v4:1,fx:[{on:'entrar',op:'compra',v:1}],texto:'Ao entrar: compre 1 carta.',sabor:'Leva a feira inteira nas costas. Sem pressa.'},
 {id:'porco-comilao',nome:'Porco Comilão',curto:'Porco',tipo:'criatura',terreno:'pasto',rar:'incomum',custo:3,atk:1,hp:2,familia:'rebanho',golpe:'mordida',arena:3,art:'E',v4:1,fx:[{on:'abateRival',op:'cresce',a:1,h:0}],texto:'Sempre que uma criatura rival cair, ganha +1 ATK.',sabor:'Não sobra nem o farelo.'},
 {id:'vaqueiro-aboiador',nome:'Vaqueiro Aboiador',curto:'Vaqueiro',tipo:'criatura',terreno:'pasto',rar:'incomum',custo:3,atk:2,hp:3,familia:'sitio',golpe:'chicote',arena:4,art:'E',v4:1,fx:[{on:'entrar',op:'buffFamiliaTemp',fam:'rebanho',a:1,acorda:1,grito:1}],texto:'Grito: suas criaturas do Rebanho acordam e ganham +1 ATK neste turno.',sabor:'Um aboio e a boiada vem atrás.'},
 {id:'boi-bumba',nome:'Boi-Bumbá',curto:'Boi-Bumbá',tipo:'criatura',terreno:'pasto',rar:'lendaria',custo:7,atk:5,hp:6,kw:{pisotear:1},familia:'rebanho',golpe:'chifrada',arena:5,art:'E',v4:1,fx:[{on:'entrar',op:'buffOutras',a:1,h:1,grito:1},{on:'passivo',op:'festaEntrada',a:1,h:1}],texto:'Pisotear. Grito: suas outras criaturas ganham +1/+1. As que entrarem depois também ganham.',sabor:'Quando ele dança, a festa não acaba.'},
 // ---- Neutro (B) ----
 {id:'gato-do-celeiro',nome:'Gato do Celeiro',tipo:'criatura',terreno:'neutro',rar:'comum',custo:3,atk:3,hp:3,fx:[{on:'entrar',op:'danoFrente',v:1}],texto:'Ao entrar: causa 1 de dano à criatura da frente.',sabor:'Patrulha o celeiro desde antes de você chegar.'},
 {id:'moinho-de-vento',nome:'Moinho de Vento',curto:'Moinho',tipo:'construcao',terreno:'neutro',rar:'rara',custo:3,n:[1,1,1,1,2],fx:[{on:'inicio',op:'inicioEnergia'}],texto:'No início do seu turno: ganhe +{n} de energia.',sabor:'Gira, gira, e a fazenda anda.',nLabel:'Energia extra'},
 // ---- Neutro (v4) ----
 {id:'vira-lata-caramelo',nome:'Vira-lata Caramelo',curto:'Caramelo',tipo:'criatura',terreno:'neutro',rar:'comum',custo:2,atk:1,hp:3,kw:{guarda:1},familia:'sitio',golpe:'mordida',arena:1,art:'C',v4:1,texto:'Guarda.',sabor:'Não tem dono. Tem a fazenda inteira.'},
 {id:'danca-da-chuva',nome:'Dança da Chuva',curto:'Dança',tipo:'feitico',terreno:'neutro',rar:'incomum',custo:3,alvo:null,n:[1,1,2,2,2],golpe:'respingo',arena:4,art:'D',v4:1,fx:[{on:'feitico',op:'vidaTimeCura'}],texto:'Suas criaturas ganham +0/+{n} e curam toda a vida.',sabor:'Dois passinhos pra lá, um pra cá, e o céu responde.',nLabel:'Vida extra'},
 {id:'trator-vermelho',nome:'Trator Vermelho',curto:'Trator',tipo:'construcao',terreno:'neutro',rar:'rara',custo:3,n:[1,1,2,2,2],arena:4,art:'C',v4:1,fx:[{on:'inicio',op:'inicioTrator'}],texto:'No início do seu turno: a criatura deste terreno ganha Pisotear e +{n} ATK neste turno.',sabor:'Velho, barulhento e nunca falhou.',nLabel:'ATK extra'},
 {id:'sanfoneiro-do-forro',nome:'Sanfoneiro do Forró',curto:'Sanfoneiro',tipo:'criatura',terreno:'neutro',rar:'rara',custo:2,atk:1,hp:3,familia:'sitio',golpe:'estouro',arena:4,art:'C',v4:1,fx:[{on:'passivo',op:'sequenciaMenos'}],texto:'Enquanto ele estiver em campo, seu Combo começa na 2ª carta do turno.',sabor:'Puxa o fole e ninguém fica parado.'},
 // ---- Fichas ----
 {id:'cereja',nome:'Cereja',tipo:'criatura',terreno:'pomar',rar:'comum',custo:0,atk:1,hp:1,texto:'',sabor:'—',ficha:true},
 {id:'filhote',nome:'Filhote',tipo:'criatura',terreno:'milharal',rar:'comum',custo:0,atk:1,hp:1,kw:{furia:1},familia:'aves',golpe:'bicada',art:'C',texto:'Fúria.',sabor:'—',ficha:true},
 {id:'zangao',nome:'Zangão',tipo:'criatura',terreno:'pomar',rar:'comum',custo:0,atk:1,hp:1,kw:{voar:1},familia:'bichinhos',golpe:'ferrao',art:'D',texto:'Voar.',sabor:'—',ficha:true},
 {id:'girino',nome:'Girino',tipo:'criatura',terreno:'brejo',rar:'comum',custo:0,atk:1,hp:1,kw:{espinhos:1},familia:'brejeiros',golpe:'respingo',art:'E',texto:'Espinhos 1.',sabor:'—',ficha:true}
];
/* v4: famílias das cartas antigas e o estilo de golpe (animação de ataque) */
const FAM_V1={'corvo-ladino':'aves','revoada-noturna':'aves','pintinho-valente':'aves','garca-pescadora':'aves',
 'abelha-operaria':'bichinhos','joaninha-curandeira':'bichinhos','libelula-faisca':'bichinhos',
 'sapinho-verruguento':'brejeiros','rainha-das-ras':'brejeiros','velho-lodao':'brejeiros',
 'ovelha-felpuda':'rebanho','cabrito-teimoso':'rebanho','vaca-mimosa':'rebanho','bode-marrento':'rebanho','touro-trovao':'rebanho','matriarca-mugidora':'rebanho',
 'espiga-sapeca':'roca','pipoqueiro-explosivo':'roca','rei-milhao':'roca','maca-rolica':'roca','cerejas-gemeas':'roca','macieira-ancia':'roca','guardia-florada':'roca','taboa-espinhosa':'roca','cereja':'roca',
 'espantalho-guardiao':'sitio','gato-do-celeiro':'sitio'};
const GOLPE_V1={'espiga-sapeca':'pisao','corvo-ladino':'bicada','espantalho-guardiao':'chicote','pipoqueiro-explosivo':'estouro','revoada-noturna':'bicada','rei-milhao':'raio',
 'maca-rolica':'pisao','abelha-operaria':'ferrao','cerejas-gemeas':'pisao','joaninha-curandeira':'mordida','macieira-ancia':'chicote','guardia-florada':'chicote',
 'pintinho-valente':'bicada','sapinho-verruguento':'respingo','libelula-faisca':'raio','taboa-espinhosa':'chicote','garca-pescadora':'bicada','rainha-das-ras':'respingo',
 'velho-lodao':'mordida','ovelha-felpuda':'pisao','cabrito-teimoso':'chifrada','vaca-mimosa':'pisao','bode-marrento':'chifrada','touro-trovao':'chifrada',
 'matriarca-mugidora':'pisao','gato-do-celeiro':'garra','cereja':'pisao'};
const CARD={};
for(const c of CARDS){c.kw=c.kw||{};c.fx=c.fx||[];c.arena=c.arena||(c.terreno==='pomar'?2:c.terreno==='brejo'?3:1);
  c.familia=c.tipo==='criatura'?(c.familia||FAM_V1[c.id]||null):null;c.golpe=c.golpe||GOLPE_V1[c.id]||null;c.curto=c.curto||c.nome;CARD[c.id]=c;}
const COLECAO=CARDS.filter(c=>!c.ficha);
const CARD_ORDER={};COLECAO.forEach((c,i)=>CARD_ORDER[c.id]=i);

const KW_INFO={
 furia:{nome:'Fúria',tip:'Pode atacar no turno em que entra.'},
 voar:{nome:'Voar',tip:'Ataca o herói rival por cima da criatura da frente, a não ser que ela também tenha Voar (ou seja o Espantalho Guardião).'},
 espinhos:{nome:'Espinhos',tip:'Quando leva dano de um ataque, causa X de dano a quem atacou.'},
 brotar:{nome:'Brotar',tip:'No início do seu turno, ganha +0/+1 (vida máxima e atual).'},
 pisotear:{nome:'Pisotear',tip:'Se o ataque matar a criatura da frente, o dano que sobrar vai para o herói rival.'},
 ataqueDuplo:{nome:'Ataca duas vezes',tip:'Ataca duas vezes.'},
 bloqueiaVoo:{nome:'Bloqueia Voar',tip:'Bloqueia criaturas com Voar.'},
 guarda:{nome:'Guarda',tip:'Protege os terrenos vizinhos vazios: um ataque rival que iria no seu herói por um deles acerta esta criatura. Criaturas com Voar passam por cima, a não ser que a Guarda também tenha Voar ou Bloqueia Voar.'},
 couraca:{nome:'Couraça',tip:'Recebe X de dano a menos de cada ataque.'}
};
const KW_ORDEM=['furia','voar','espinhos','brotar','pisotear','ataqueDuplo','bloqueiaVoo','guarda','couraca'];
/* v4: palavras-chave com número (mostram X no ícone) */
const KW_NUM={espinhos:1,couraca:1};
/* v4: rótulos em negrito, status e sistemas novos (folha "Como jogar", códex e detalhe da carta) */
const ROTULO_INFO={
 ninhada:{nome:'Ninhada:',tip:'Ao entrar, cria as fichas nos terrenos vazios vizinhos (esquerda primeiro).'},
 grito:{nome:'Grito:',tip:'Ao entrar, afeta as suas outras criaturas em campo.'},
 raiz:{nome:'Enraizada',tip:'Enraizada: não ataca no próximo combate do dono.'},
 familia:{nome:'Família',tip:'Família: com 2 criaturas da mesma família em campo, todas elas ganham um bônus. Com 3 ou mais, um bônus maior. O bônus some se elas saírem.'},
 dupla:{nome:'Dupla',tip:'Dupla: duas cartas certas do mesmo lado (lado a lado, ou criatura e construção no mesmo terreno) fazem um efeito extra, uma vez por partida.'},
 combo:{nome:'Combo',tip:'Combo: coloque 3 cartas em campo no mesmo turno (criaturas ou construções; feitiços não contam). Combo x3! Suas criaturas em campo ganham +1 ATK neste turno. A 4ª e a 5ª carta causam 1 de dano no herói rival cada.'}
};
/* texto em negrito nas cartas (textoCarta): as palavras antigas + as novas do v4 */
const NEGRITO_RE=/(Fúria|Voar|Espinhos \d+|Brotar|Pisotear|Ataca duas vezes|Bloqueia criaturas com Voar|Ao entrar:|Ao morrer:|No início do seu turno:|Guarda|Couraça \d+|Ninhada:|Grito:|Enraizadas?|Combo)/g;
/* artigo do nome da ficha no Diário ("Nasceu um Filhote...") */
const FICHA_ART={cereja:'uma',filhote:'um',zangao:'um',girino:'um'};

/* ---------- v4: famílias ---------- */
const FAMILIAS={
 aves:{nome:'Aves',cor:'#9FD4F0',ic:'pena',niv:[{a:1},{a:1,kw:{voar:1}}],txt:['+1 ATK','+1 ATK e Voar']},
 bichinhos:{nome:'Bichinhos',cor:'#F49AC1',ic:'joaninha',niv:[{a:1},{a:1,kw:{espinhos:1}}],txt:['+1 ATK','+1 ATK e Espinhos 1']},
 brejeiros:{nome:'Brejeiros',cor:'#A77BE0',ic:'sapo',niv:[{kw:{espinhos:1}},{h:2,kw:{espinhos:1}}],txt:['Espinhos +1','Espinhos +1 e +0/+2']},
 rebanho:{nome:'Rebanho',cor:'#F4E3B5',ic:'chifre',niv:[{h:1},{a:1,h:1,kw:{pisotear:1}}],txt:['+0/+1','+1/+1 e Pisotear']},
 roca:{nome:'Roça',cor:'#9BD34B',ic:'broto',niv:[{h:1},{h:1,kw:{brotar:1}}],txt:['+0/+1','+0/+1 e Brotar']},
 sitio:{nome:'Sítio',cor:'#E8862E',ic:'casinha',niv:[{h:1},{a:1,h:1,kw:{bloqueiaVoo:1}}],txt:['+0/+1','+1/+1 e Bloqueia Voar']}
};
const FAM_ORDEM=['aves','bichinhos','brejeiros','rebanho','roca','sitio'];
const membrosFamilia=f=>CARDS.filter(c=>c.familia===f);

/* ---------- v4: duplas (duas cartas certas do mesmo lado) ---------- */
const DUPLAS=[
 // --- só cartas antigas ---
 {id:'mel-dourado',nome:'Mel Dourado',a:'abelha-operaria',b:'colmeia-dourada',tipo:'terreno',cor:'#F2C230',val:6,
  fx:[{op:'buffCarta',quem:'a',a:2,h:2},{op:'curaHeroi',v:3}],txt:'A Abelha ganha +2/+2 e seu herói cura 3.'},
 {id:'leite-com-mel',nome:'Leite com Mel',a:'vaca-mimosa',b:'abelha-operaria',tipo:'vizinho',cor:'#F4E3B5',val:5,
  fx:[{op:'curaHeroi',v:4},{op:'buffCarta',quem:'ambas',a:0,h:2}],txt:'Seu herói cura 4 e as duas ganham +0/+2.'},
 {id:'susto-no-milharal',nome:'Susto no Milharal',a:'espantalho-guardiao',b:'corvo-ladino',tipo:'vizinho',cor:'#A77BE0',val:3,
  fx:[{op:'perdeAtkFrente',quem:'ambas',v:1}],txt:'As criaturas rivais da frente das duas perdem 1 de ATK.'},
 {id:'estouro-da-boiada',nome:'Estouro da Boiada',a:'bode-marrento',b:'cabrito-teimoso',tipo:'vizinho',cor:'#E8862E',val:5,
  fx:[{op:'buffCarta',quem:'ambas',a:1,h:0,temp:1,acorda:1}],txt:'As duas acordam e ganham +1 ATK neste turno.'},
 {id:'coro-do-brejo',nome:'Coro do Brejo',a:'sapinho-verruguento',b:'rainha-das-ras',tipo:'vizinho',cor:'#3BA39A',val:4,
  fx:[{op:'danoTodasRivais',v:1}],txt:'Causa 1 de dano a cada criatura rival.'},
 {id:'pomar-em-flor',nome:'Pomar em Flor',a:'macieira-ancia',b:'joaninha-curandeira',tipo:'vizinho',cor:'#F49AC1',val:5,
  fx:[{op:'curaTotalAliadas'},{op:'curaHeroi',v:3}],txt:'Cura toda a vida das suas criaturas e 3 do seu herói.'},
 {id:'fuba-fresquinho',nome:'Fubá Fresquinho',a:'espiga-sapeca',b:'moinho-de-vento',tipo:'terreno',cor:'#D9A066',val:4,
  fx:[{op:'energia',v:2}],txt:'Ganhe +2 de energia agora.'},
 {id:'curral-seguro',nome:'Curral Seguro',a:'ovelha-felpuda',b:'cerca-de-pedra',tipo:'terreno',cor:'#C9CFC9',val:4,
  fx:[{op:'buffCarta',quem:'a',a:1,h:3}],txt:'A Ovelha ganha +1/+3.'},
 {id:'tempestade-de-verao',nome:'Tempestade de Verão',a:'touro-trovao',b:'libelula-faisca',tipo:'vizinho',cor:'#4A7FC1',val:6,
  fx:[{op:'danoTodasRivais',v:1},{op:'danoHeroiRival',v:2}],txt:'Causa 1 de dano a cada criatura rival e 2 no herói rival.'},
 // --- com cartas novas ---
 {id:'gato-e-cachorro',nome:'Gato e Cachorro',a:'gato-do-celeiro',b:'vira-lata-caramelo',tipo:'vizinho',cor:'#FF8A3D',val:5,
  fx:[{op:'danoFrente',quem:'ambas',v:2}],txt:'Cada um causa 2 de dano à criatura rival da frente dele.'},
 {id:'bom-dia-fazenda',nome:'Bom Dia, Fazenda!',a:'galo-despertador',b:'pintinho-valente',tipo:'vizinho',cor:'#FFD35A',val:4,
  fx:[{op:'buffTime',a:1,h:0,temp:1}],txt:'Suas criaturas ganham +1 ATK neste turno.'},
 {id:'mae-e-filho',nome:'Mãe e Filho',a:'vaca-mimosa',b:'bezerro-manhoso',tipo:'vizinho',cor:'#FFB3D1',val:5,
  fx:[{op:'buffCarta',quem:'b',a:2,h:2},{op:'curaHeroi',v:2}],txt:'O Bezerro ganha +2/+2 e seu herói cura 2.'},
 {id:'forro-no-terreiro',nome:'Forró no Terreiro',a:'sanfoneiro-do-forro',b:'vaqueiro-aboiador',tipo:'vizinho',cor:'#E0565B',val:6,
  fx:[{op:'buffTime',a:1,h:1}],txt:'Suas criaturas ganham +1/+1.'},
 {id:'trator-turbinado',nome:'Trator Turbinado',a:'bode-marrento',b:'trator-vermelho',tipo:'terreno',cor:'#C4362F',val:5,
  fx:[{op:'buffCarta',quem:'a',a:1,h:0,acorda:1}],txt:'O Bode ganha +1 ATK e acorda.'},
 {id:'ninho-seguro',nome:'Ninho Seguro',a:'codorna-ninheira',b:'galinheiro',tipo:'terreno',cor:'#D9A066',val:4,
  fx:[{op:'criaFichaVazios',ficha:'filhote'}],txt:'Nasce um Filhote 1/1 com Fúria em cada terreno vazio seu.'},
 {id:'arraia-do-boi',nome:'Arraiá do Boi',a:'boi-bumba',b:'sanfoneiro-do-forro',tipo:'vizinho',cor:'#B36BE8',val:6,
  fx:[{op:'buffTime',a:1,h:0,temp:1,acorda:1},{op:'curaHeroi',v:3}],txt:'Suas criaturas acordam e ganham +1 ATK neste turno. Seu herói cura 3.'},
 {id:'serenata-do-brejo',nome:'Serenata do Brejo',a:'sapo-cururu',b:'perereca-grudenta',tipo:'vizinho',cor:'#9BD34B',val:4,
  fx:[{op:'enraizaFrente',quem:'ambas'}],txt:'As criaturas rivais da frente das duas ficam Enraizadas.'},
 {id:'enxame-real',nome:'Enxame Real',a:'abelha-rainha',b:'colmeia-dourada',tipo:'terreno',cor:'#FFE066',val:5,
  fx:[{op:'buffFamilia',fam:'bichinhos',a:1,h:1}],txt:'Seus Bichinhos ganham +1/+1.'}
];
const DUPLA={};DUPLAS.forEach(d=>DUPLA[d.id]=d);
/* duplas de cada carta (para o detalhe da carta e a busca rápida do motor) */
const DUPLAS_DE={};DUPLAS.forEach(d=>{(DUPLAS_DE[d.a]=DUPLAS_DE[d.a]||[]).push(d);(DUPLAS_DE[d.b]=DUPLAS_DE[d.b]||[]).push(d);});
const DUPLA_TIPO_TXT={vizinho:'lado a lado',terreno:'no mesmo terreno'};

/* ---------- v4: Combo (sequência de cartas no mesmo turno) ---------- */
/* Combo: só criaturas e construções jogadas da mão contam (feitiços e fichas não) */
const COMBO={limiar:3,limiarSanf:2,danoMax:2,feiticos:false};

/* níveis */
const LVL_BONUS=[[0,0],[0,1],[1,1],[1,2],[2,2]];
const UPG={ // [copias, grao] para ir ao Nv 2..5
 comum:[[2,10],[3,25],[5,60],[8,150]],
 incomum:[[2,20],[3,50],[4,120],[6,300]],
 rara:[[1,40],[2,100],[3,250],[4,600]],
 epica:[[1,100],[1,250],[2,500],[2,1000]],
 lendaria:[[1,200],[1,500],[1,1000],[1,2000]]
};
const PO_QUEIMA={comum:5,incomum:15,rara:60,epica:250,lendaria:1000};
const PO_CRIAR={comum:40,incomum:120,rara:400,epica:1500,lendaria:5000};

/* chances */
const ODDS={
 normal:{comum:70,incomum:22,rara:6,epica:1.7,lendaria:0.3},
 incomum:{incomum:75,rara:19,epica:5,lendaria:1},
 rara:{rara:80,epica:16,lendaria:4},
 epica:{epica:85,lendaria:15},
 lendaria:{lendaria:100}
};
const ODDS_NOME={normal:'Normal',incomum:'Incomum ou melhor',rara:'Rara ou melhor',epica:'Épica ou melhor (Baú Encantado)',lendaria:'Lendária (Baú Lendário)'};
const PACKS={
 semente:{nome:'Pacote Semente',curto:'Semente',preco:100,slots:['normal','normal','normal','normal','incomum'],linha:'5 cartas · 1 Incomum ou melhor',chance:['46,3%','13,3%','2,2%']},
 colheita:{nome:'Pacote Colheita',curto:'Colheita',preco:200,slots:['normal','normal','normal','incomum','rara'],linha:'5 cartas · 1 Rara ou melhor',chance:['100%','29,2%','5,8%']}
};

/* arenas */
const ARENAS=[
 {n:1,nome:'Horta do Quintal',trof:0,rival:'tonico',tier:'facil',win:20,mult:1,cena:'a1',novas:'Milharal, Pasto e Celeiro'},
 {n:2,nome:'Pomar das Abelhas',trof:120,rival:'ameixa',tier:'medio',win:25,mult:1.25,cena:'a2',novas:'Pomar',terr:'pomar'},
 {n:3,nome:'Brejo Nebuloso',trof:300,rival:'lodoso',tier:'medio',win:30,mult:1.5,cena:'a3',novas:'Brejo',terr:'brejo'},
 {n:4,nome:'Silo de Pedra',trof:550,rival:'lanuda',tier:'dificil',win:35,mult:1.75,cena:'a4',novas:'Trator, Galinheiro, Sanfoneiro e mais'},
 {n:5,nome:'Festa da Colheita',trof:900,rival:'trovoada',tier:'dificil',win:40,mult:2,cena:'a5',novas:'As lendas da Festa'}
];
const TIER_NOME={facil:'Fácil',medio:'Médio',dificil:'Difícil'};

const RIVAIS={
 pipoca:{nome:'Pipoca, o Espantalho Aprendiz',curto:'Pipoca',retrato:'rival-pipoca',sig:'espantalho-guardiao',lanes:['milharal','milharal','milharal','milharal']},
 tonico:{nome:'Tonico Sabugo',curto:'Tonico',retrato:'rival-tonico',sig:'espiga-sapeca',lanes:['milharal','milharal','pasto','milharal'],
  deck:{'espiga-sapeca':2,'corvo-ladino':2,'chuva-de-graos':2,'pintinho-valente':2,'gato-do-celeiro':1,'vira-lata-caramelo':1,'espantalho-guardiao':2,'ovelha-felpuda':2,'cabrito-teimoso':2,'bode-marrento':2,'codorna-ninheira':1,'pipoqueiro-explosivo':1}},
 ameixa:{nome:'Dona Ameixa',curto:'Dona Ameixa',retrato:'rival-ameixa',sig:'maca-rolica',lanes:['pomar','pasto','pomar','pasto'],
  deck:{'abelha-operaria':2,'cerejas-gemeas':2,'maca-rolica':1,'pe-de-maracuja':1,'formiga-carregadeira':2,'louva-a-deus':1,'espiga-sapeca':2,'corvo-ladino':1,'cabrito-teimoso':2,'bode-marrento':2,'gato-do-celeiro':1,'colmeia-dourada':1,'joaninha-curandeira':1,'orvalho-da-manha':1}},
 lodoso:{nome:'Barão Lodoso',curto:'Barão',retrato:'rival-lodoso',sig:'sapinho-verruguento',lanes:['brejo','milharal','brejo','brejo'],
  deck:{'sapinho-verruguento':2,'perereca-grudenta':2,'libelula-faisca':1,'vaga-lume-piscante':1,'lodo-pegajoso':2,'taboa-espinhosa':1,'sapo-cururu':2,'garca-pescadora':1,'atoleiro':1,'rainha-das-ras':1,'cagado-ranzinza':1,'espiga-sapeca':2,'chuva-de-graos':2,'espantalho-guardiao':1}},
 lanuda:{nome:'Mestra Lanuda',curto:'Mestra Lanuda',retrato:'rival-lanuda',sig:'ovelha-felpuda',lanes:['pasto','pasto','pomar','pasto'],
  deck:{'ovelha-felpuda':2,'cabrito-teimoso':2,'bezerro-manhoso':2,'feno-fresquinho':1,'vaca-mimosa':1,'bode-marrento':1,'porco-comilao':1,'trator-vermelho':1,'touro-trovao':1,'maca-rolica':2,'joaninha-curandeira':1,'cerejas-gemeas':2,'adubo-magico':1,'vaqueiro-aboiador':1,'vira-lata-caramelo':1}},
 trovoada:{nome:'Vovó Trovoada',curto:'Vovó Trovoada',retrato:'rival-trovoada',sig:'touro-trovao',lanes:['milharal','brejo','pasto','brejo'],
  deck:{'chuva-de-graos':2,'espiga-sapeca':2,'gato-do-celeiro':1,'garca-pescadora':2,'atoleiro':1,'libelula-faisca':2,'galo-despertador':1,'bode-marrento':1,'touro-trovao':1,'revoada-noturna':1,'velho-lodao':1,'boi-bumba':1,'sucuri-do-charco':1,'sapinho-verruguento':1,'cabrito-teimoso':2}},
 // ---- v4: rivais justos (Torneio da Feira, Desafio do Dia e Treino) ----
 zeca:{nome:'Zeca Pamonheiro',curto:'Zeca',retrato:'rival-zeca',sig:'codorna-ninheira',lanes:['milharal','milharal','pasto','milharal'],
  deck:{'codorna-ninheira':2,'pamonha-quentinha':2,'espiga-sapeca':2,'corvo-ladino':2,'pintinho-valente':2,'galo-despertador':1,'galinheiro':1,'chuva-de-graos':2,'cabrito-teimoso':2,'bezerro-manhoso':2,'jegue-carregador':1,'gato-do-celeiro':1},
  jeito:'Vendedor de pamonha magrelo e animado.'},
 cocada:{nome:'Tia Cocada',curto:'Tia Cocada',retrato:'rival-cocada',sig:'abelha-rainha',lanes:['pomar','pomar','brejo','pomar'],
  deck:{'abelha-operaria':2,'formiga-carregadeira':2,'joaninha-curandeira':1,'louva-a-deus':2,'pe-de-maracuja':2,'maca-rolica':2,'cerejas-gemeas':1,'colmeia-dourada':1,'cipo-enrolado':2,'orvalho-da-manha':1,'vaga-lume-piscante':2,'abelha-rainha':1,'macieira-ancia':1},
  jeito:'Doceira redonda e risonha.'},
 sanfona:{nome:'Mestre Sanfona',curto:'Mestre Sanfona',retrato:'rival-sanfona',sig:'sanfoneiro-do-forro',lanes:['pasto','milharal','pasto','pasto'],
  deck:{'sanfoneiro-do-forro':1,'vaqueiro-aboiador':2,'vira-lata-caramelo':2,'gato-do-celeiro':1,'bezerro-manhoso':2,'bode-marrento':2,'cabrito-teimoso':2,'porco-comilao':1,'vaca-mimosa':1,'trator-vermelho':1,'boi-bumba':1,'danca-da-chuva':1,'pamonha-quentinha':1,'galo-despertador':1,'espantalho-guardiao':1},
  jeito:'Velho mestre da sanfona, de barba branca: o campeão da feira.'}
};
const RETRATO_VOCE={id:'heroi-voce',sig:'pintinho-valente'};
const RETRATO_ZINHA={id:'mentora-zinha',sig:'vaca-mimosa'};

const STARTER={'espiga-sapeca':2,'pintinho-valente':2,'corvo-ladino':2,'chuva-de-graos':2,'ovelha-felpuda':2,'cabrito-teimoso':2,'feno-fresquinho':1,'gato-do-celeiro':2,'espantalho-guardiao':2,'bode-marrento':2,'vaca-mimosa':1};
const STARTER_LANES=['milharal','pasto','milharal','pasto'];

/* baús */
const BAUS={
 madeira:{nome:'Caixote de Madeira',tempo:30,cartas:a=>3,garantia:null,grao:[10,20]},
 prata:{nome:'Baú de Prata',tempo:120,cartas:a=>6+(a-1),garantia:'incomum',grao:[30,45]},
 ouro:{nome:'Baú de Ouro',tempo:300,cartas:a=>10+2*(a-1),garantia:'rara',grao:[80,110],pacote:true},
 encantado:{nome:'Baú Encantado',tempo:300,cartas:a=>6+(a-1),garantia:'epica',grao:[120,120]},
 lendario:{nome:'Baú Lendário',tempo:300,cartas:a=>4,garantia:'lendaria',grao:[200,200]}
};
const BAU_CICLO=['prata','madeira','madeira','prata','madeira','ouro','madeira','prata','madeira','encantado'];

/* missões */
const MISSOES=[
 {id:'vencer2',g:'batalha',txt:'Vença 2 partidas',ev:'vitoria',alvo:2,rec:{grao:40}},
 {id:'criaturas12',g:'batalha',txt:'Jogue 12 criaturas',ev:'criatura',alvo:12,rec:{grao:30}},
 {id:'feiticos5',g:'batalha',txt:'Jogue 5 feitiços',ev:'feitico',alvo:5,rec:{grao:30}},
 {id:'dano40',g:'batalha',txt:'Cause 40 de dano no herói rival',ev:'danoHeroi',alvo:40,rec:{grao:30}},
 {id:'abates10',g:'batalha',txt:'Derrote 10 criaturas rivais',ev:'abate',alvo:10,rec:{grao:30}},
 {id:'baus2',g:'progresso',txt:'Abra 2 baús',ev:'bau',alvo:2,rec:{grao:25}},
 {id:'pacote1',g:'progresso',txt:'Abra 1 pacote',ev:'pacote',alvo:1,rec:{po:25}},
 {id:'melhorar1',g:'progresso',txt:'Melhore 1 carta',ev:'melhoria',alvo:1,rec:{po:30}},
 {id:'negocio1',g:'economia',txt:'Faça 1 negócio no Mercado',ev:'negocio',alvo:1,rec:{grao:25}},
 {id:'queimar3',g:'economia',txt:'Queime 3 cartas',ev:'queimar',alvo:3,rec:{grao:20}},
 // v4 (req: só entra no sorteio quando o modo já abriu para o jogador)
 {id:'dupla1',g:'batalha',txt:'Faça 1 dupla',ev:'dupla',alvo:1,rec:{grao:30}},
 {id:'combo2',g:'batalha',txt:'Faça 2 Combos x3',ev:'sequencia',alvo:2,rec:{grao:30}},
 {id:'treino1',g:'progresso',txt:'Faça 1 treino',ev:'treino',alvo:1,rec:{po:20},req:'treino'},
 {id:'desafio1',g:'progresso',txt:'Vença o Desafio do Dia',ev:'desafio',alvo:1,rec:{po:30},req:'desafio'}
];
const MISSAO={};MISSOES.forEach(m=>MISSAO[m.id]=m);
const MISSOES_DIA1=['vencer2','melhorar1','negocio1'];

/* trilha */
const TRILHA=[
 {t:30,grao:30},{t:60,pacotes:{semente:1}},{t:90,po:30},
 {t:120,arena:2,pacotes:{semente:1}},{t:180,grao:60},{t:240,po:60},
 {t:300,arena:3,pacotes:{colheita:1}},{t:400,grao:100},
 {t:550,arena:4,pacotes:{semente:2}},{t:700,po:150},
 {t:900,arena:5,pacotes:{colheita:1},po:500}
];

/* ---------- v4: modos de batalha ---------- */
/* Desafio do Dia: uma regra especial por dia (REGRAS[(dia*4)%11]) e um rival (DESAFIO.rivais[(dia*3)%8]) */
const REGRAS=[
 {id:'chuva',nome:'Chuva de Verão',txt:'Todas as criaturas têm Brotar.',ic:'nuvem'},
 {id:'seca',nome:'Seca e Cheia',txt:'Os terrenos de Brejo viram Pasto, e os de Pasto viram Brejo.',ic:'sol',troca:{brejo:'pasto',pasto:'brejo'}},
 {id:'ventania',nome:'Ventania',txt:'Voar não funciona: toda criatura ataca a da frente.',ic:'vento'},
 {id:'feira',nome:'Feira Livre',txt:'Os dois lados ganham +1 de energia em todo turno.',ic:'barraca'},
 {id:'corvos',nome:'Noite dos Corvos',txt:'Criaturas com Voar ganham +1 ATK.',ic:'corvo'},
 {id:'lua',nome:'Lua Cheia',txt:'Toda criatura entra acordada, mas no turno em que entra só ataca criaturas.',ic:'lua'},
 {id:'colheita',nome:'Colheita Antecipada',txt:'A Hora da Colheita começa na rodada 5.',ic:'foice',rodada:5},
 {id:'mutirao',nome:'Mutirão',txt:'Os dois começam com 6 cartas na mão.',ic:'maos'},
 {id:'familias',nome:'Festa das Famílias',txt:'O bônus de família maior já vale com 2 criaturas.',ic:'familia'},
 {id:'duplas',nome:'Dia das Duplas',txt:'Duplas valem em qualquer terreno seu, não só vizinhas.',ic:'dupla'},
 {id:'cerca',nome:'Cerca Viva',txt:'Toda criatura entra com +0/+1.',ic:'cerca',vida:1}
];
const REGRA={};REGRAS.forEach(r=>REGRA[r.id]=r);
const DESAFIO={arenaMin:2,rivais:['tonico','ameixa','lodoso','lanuda','trovoada','zeca','cocada','sanfona'],premio:{pacotes:{semente:1},po:30}};
/* Torneio da Feira: 3 partidas seguidas; a inscrição é queimada */
const TORNEIO={arenaMin:3,taxa:60,maxDia:2,cura:8,finalNv:0,
 etapas:[{nome:'Primeira rodada',rival:'zeca',tier:'medio'},{nome:'Semifinal',rival:'cocada',tier:'medio'},{nome:'Final',rival:'sanfona',tier:'dificil'}],
 premios:[{po:15},{po:40},{po:60,pacotes:{semente:1}},{po:120,pacotes:{colheita:1},faixa:1}]};
const MODO_NOME={arena:'Arena',treino:'Treino',desafio:'Desafio do Dia',torneio:'Torneio da Feira'};
const RIVAIS_FEIRA=['zeca','cocada','sanfona'];

/* mercado */
/* preço base ancorado no custo de conseguir UMA carta específica (comprar avulsa custa caro);
   os robôs compram de volta por LANCE_FRAC do preço, perto do valor da carta queimada em Pó.
   Assim o valor médio de um pacote revendido fica abaixo do preço do pacote. */
const MERC={
 comum:{base:20,T:40,q:.30},incomum:{base:50,T:20,q:.20},rara:{base:150,T:8,q:.10},epica:{base:500,T:4,q:.05},lendaria:{base:1800,T:2,q:.02}
};
const LANCE_FRAC=0.30;
const MIGRACAO=3; // versão das regras salvas em s.mig (3 = v4: modos, códex, torneio)
const ROBOS=['Tonhão','Zuleica','Bentinho','Cacilda','Juvêncio','Mariquinha','Ditinho','Florinda'];
const TICK_MS=20000;
const CAP_DIA=300;

/* tutorial */
const TUT={
 hand:['espiga-sapeca','pintinho-valente','ovelha-felpuda','chuva-de-graos'],
 draws:['corvo-ladino','bode-marrento','gato-do-celeiro'],
 bau:{cartas:['corvo-ladino','cabrito-teimoso','pintinho-valente'],grao:15},
 pacote:['espiga-sapeca','espiga-sapeca','ovelha-felpuda','vento-dourado','pipoqueiro-explosivo']
};

