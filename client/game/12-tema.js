/* ===================== TEMA: Mata Adentro (folclore brasileiro) =====================
   Camada de tema: só nomes e textos. Os ids, números e regras de 10-data.js não mudam.
   Trocar o tema = trocar este arquivo. O nome do jogo mora só em TEMA.jogo. */
const TEMA={
 jogo:{nome:'Mata Adentro',caps:'MATA ADENTRO',sub:'Duelo de Lendas do Brasil',intro:'duelo de lendas do Brasil · moeda simulada'},
 moeda:{nome:'Vintém',plural:'Vinténs',caps:'VINTÉNS'},
 po:{nome:'Brasa',plural:'Brasas',caps:'BRASAS'},
 terr:{milharal:'Sertão',pomar:'Mata',brejo:'Águas',pasto:'Noite',neutro:'Arraial'},
 terrCor:{milharal:'#E8862E',pomar:'#3FA34D',brejo:'#2E9FB5',pasto:'#7B5BD6',neutro:'#B08A5A'},
 /* ---- cartas (as 60 + 4 fichas) ---- */
 cartas:{
  // Sertão (milharal)
  'espiga-sapeca':{nome:'Fagulha Saltadeira',curto:'Fagulha',texto:'Fúria.',sabor:'Pulou da fogueira antes de apagar.'},
  'corvo-ladino':{nome:'Acauã Agourenta',curto:'Acauã',texto:'Voar.',sabor:'Quando ela ri no galho seco, a vila inteira se arrepia.'},
  'chuva-de-graos':{nome:'Chuva de Brasa',curto:'Chuva de Brasa',texto:'Causa {n} de dano a uma criatura rival.',sabor:'Quando o céu do sertão resolve cuspir fogo.'},
  'espantalho-guardiao':{nome:'Vigia da Porteira',curto:'Vigia',texto:'Bloqueia criaturas com Voar.',sabor:'Passa a noite de candeeiro aceso. Nada voa por cima da porteira dele.'},
  'vento-dourado':{nome:'Redemoinho',curto:'Redemoinho',texto:'Suas criaturas ganham +{n} ATK neste turno e podem atacar mesmo se entraram agora.',sabor:'O redemoinho do meio-dia acorda até quem chegou agora.'},
  'pipoqueiro-explosivo':{nome:'Mandacaru em Brasa',curto:'Mandacaru',texto:'Fúria. Ao morrer: causa 3 de dano ao herói rival.',sabor:'Espinho por fora, brasa por dentro. Não abrace.'},
  'revoada-noturna':{nome:'Rasga-Mortalha',curto:'Rasga-Mortalha',texto:'Voar. Fúria. Ao entrar: causa 1 de dano a cada criatura rival.',sabor:'O grito dela soa como pano rasgando. Ninguém quer ouvir duas vezes.'},
  'rei-milhao':{nome:'Boitatá',curto:'Boitatá',texto:'Fúria. Ao entrar: suas outras criaturas ganham +1 ATK neste turno e podem atacar mesmo se entraram agora.',sabor:'Cobra de fogo que vigia os campos. Quem queima a mata conhece os olhos dele.'},
  'codorna-ninheira':{nome:'Mãe-da-Lua',curto:'Mãe-da-Lua',texto:'Ninhada: 1 Filhote 1/1 com Fúria.',sabor:'Parece um galho seco. Até abrir os olhos amarelos.'},
  'pamonha-quentinha':{nome:'Pimenta Braba',curto:'Pimenta',texto:'Uma criatura sua acorda e ganha +{n} ATK neste turno.',sabor:'Uma mordida e ninguém mais tem sono.'},
  'galo-despertador':{nome:'Galo de Fogo',curto:'Galo',texto:'Grito: suas outras criaturas acordam.',sabor:'Canta fora de hora. E aí ninguém dorme mais.'},
  'galinheiro':{nome:'Ninho de Brasas',curto:'Ninho',texto:'No início do seu turno: se este terreno estiver vazio, nasce nele um Filhote {n}/1 com Fúria.',sabor:'No calor das brasas, sempre cabe mais um filhote.'},
  'gaviao-real':{nome:'Mãe-do-Ouro',curto:'Mãe-do-Ouro',texto:'Voar. Ao entrar: causa 3 de dano à criatura rival com mais ATK.',sabor:'Bola de fogo que risca o céu e guarda o ouro da serra.'},
  'filhote':{nome:'Filhote',curto:'Filhote',texto:'Fúria.',sabor:'—'},
  // Mata (pomar)
  'maca-rolica':{nome:'Brotinho do Mato',curto:'Brotinho',texto:'Brotar.',sabor:'Cresce um pouquinho a cada lua.'},
  'abelha-operaria':{nome:'Abelha Jataí',curto:'Jataí',texto:'Voar. Ao entrar: cura 2 do seu herói.',sabor:'Não tem ferrão. Tem mel que cura.'},
  'orvalho-da-manha':{nome:'Orvalho da Mata',curto:'Orvalho',texto:'Uma criatura sua ganha +1/+{n}.',sabor:'Uma gota da mata vale um dia inteiro.'},
  'cerejas-gemeas':{nome:'Pequis Gêmeos',curto:'Pequis',texto:'Ninhada: 1 Pequi 1/1.',sabor:'Onde cai um, cai o outro. Cuidado com o espinho.'},
  'joaninha-curandeira':{nome:'Mariposa Curandeira',curto:'Mariposa',texto:'No início do seu turno: cura 1 de vida de todas as suas criaturas.',sabor:'Onde a asa dela passa, o machucado fecha.'},
  'colmeia-dourada':{nome:'Cortiço de Jataí',curto:'Cortiço',texto:'No início do seu turno: a criatura deste terreno ganha +1/+{n}.',sabor:'Doce é o trabalho de muitas.'},
  'macieira-ancia':{nome:'Curupira',curto:'Curupira',texto:'Brotar. Suas outras criaturas também têm Brotar (enquanto ele estiver em campo).',sabor:'Os pés virados para trás deixam um rastro que leva para longe dele.'},
  'guardia-florada':{nome:'Caipora',curto:'Caipora',texto:'Brotar. Ao entrar: cura 5 do seu herói e cura toda a vida das suas criaturas.',sabor:'Ela cuida dos bichos da mata. Quem caça demais se perde para sempre.'},
  'pe-de-maracuja':{nome:'Erva-de-Passarinho',curto:'Erva',texto:'Brotar. Suas criaturas vizinhas também têm Brotar.',sabor:'Sobe pelos galhos e leva todo mundo junto.'},
  'formiga-carregadeira':{nome:'Saúva Carregadeira',curto:'Saúva',texto:'Ao entrar: suas criaturas vizinhas ganham +0/+2.',sabor:'Carrega dez vezes o próprio peso. E ainda acha pouco.'},
  'cipo-enrolado':{nome:'Cipó-Matapau',curto:'Matapau',texto:'Causa {n} de dano a uma criatura rival e a deixa Enraizada.',sabor:'Abraça a árvore até ela virar dele.'},
  'louva-a-deus':{nome:'Põe-Mesa',curto:'Põe-Mesa',texto:'Ao entrar: causa 2 de dano à criatura da frente.',sabor:'No Nordeste chamam de põe-mesa. Parece que reza. Está mirando.'},
  'abelha-rainha':{nome:'Rainha-Marimbondo',curto:'Rainha',texto:'Voar. Ninhada: 2 Marimbondos 1/1 com Voar.',sabor:'Mexeu na casa dela, mexeu com a mata inteira.'},
  'cereja':{nome:'Pequi',curto:'Pequi',texto:'',sabor:'—'},
  'zangao':{nome:'Marimbondo',curto:'Marimbondo',texto:'Voar.',sabor:'—'},
  // Águas (brejo)
  'sapinho-verruguento':{nome:'Sapinho do Igarapé',curto:'Sapinho',texto:'Espinhos 1.',sabor:'Quem morde, se arrepende.'},
  'libelula-faisca':{nome:'Lavadeira Faísca',curto:'Lavadeira',texto:'Voar. Fúria.',sabor:'No interior, libélula é lavadeira. Essa já foi e já voltou.'},
  'lodo-pegajoso':{nome:'Lodo do Igapó',curto:'Lodo',texto:'Uma criatura rival perde {n} de ATK para sempre (mínimo 0).',sabor:'Pisou, grudou. O igapó não devolve.'},
  'taboa-espinhosa':{nome:'Aninga Espinhenta',curto:'Aninga',texto:'Espinhos 2.',sabor:'Bonita de longe. De perto também, mas dói.'},
  'garca-pescadora':{nome:'Tuiuiú Pescador',curto:'Tuiuiú',texto:'Voar. Ao entrar: causa 2 de dano à criatura da frente.',sabor:'Paciência de pedra, bico de lança.'},
  'atoleiro':{nome:'Banzeiro',curto:'Banzeiro',texto:'Destrói uma criatura rival com {n} ou menos de vida.',sabor:'A onda do rio que engole canoa e não pede licença.'},
  'rainha-das-ras':{nome:'Iara',curto:'Iara',texto:'Espinhos 2. Ao entrar: suas outras criaturas em campo ganham +1 de Espinhos.',sabor:'Quando ela canta, o rio inteiro responde.'},
  'velho-lodao':{nome:'Boiúna',curto:'Boiúna',texto:'Espinhos 2. Ao entrar: destrói a criatura da frente.',sabor:'No escuro, os olhos dela parecem as luzes de um barco. Não é um barco.'},
  'perereca-grudenta':{nome:'Perereca do Visgo',curto:'Perereca',texto:'Ao entrar: a criatura da frente perde 1 de ATK para sempre.',sabor:'Gruda primeiro, pergunta depois.'},
  'vaga-lume-piscante':{nome:'Fogo-Fátuo',curto:'Fogo-Fátuo',texto:'Voar. Espinhos 1.',sabor:'A luzinha do brejo chama, chama... e queima o dedo de quem pega.'},
  'sapo-cururu':{nome:'Sapo-Cururu',curto:'Cururu',texto:'Espinhos 1. Ninhada: 1 Girino 1/1 com Espinhos 1.',sabor:'Canta na beira do rio e todo girino vem ver.'},
  'cagado-ranzinza':{nome:'Tracajá Ancião',curto:'Tracajá',texto:'Couraça 2. Ao entrar: suas criaturas vizinhas ganham Couraça 1.',sabor:'Cem anos de rio, cem anos de mau humor.'},
  'sucuri-do-charco':{nome:'Boto Encantado',curto:'Boto',texto:'Ao entrar: a criatura da frente e as vizinhas dela ficam Enraizadas.',sabor:'Na festa, ele dança melhor que todo mundo. Quando a música para, ninguém lembra de nada.'},
  'girino':{nome:'Girino',curto:'Girino',texto:'Espinhos 1.',sabor:'—'},
  // Noite (pasto)
  'ovelha-felpuda':{nome:'Visagem',curto:'Visagem',texto:'',sabor:'Toda pancada atravessa. Ela só fica.'},
  'cabrito-teimoso':{nome:'Cabra-Cabriola',curto:'Cabriola',texto:'Pisotear.',sabor:'Bate na porta à noite cantando. Não abra.'},
  'feno-fresquinho':{nome:'Sereno da Meia-Noite',curto:'Sereno',texto:'Uma criatura sua ganha +0/+{n} e cura toda a vida.',sabor:'O orvalho frio que fecha qualquer ferida.'},
  'vaca-mimosa':{nome:'Matinta Perera',curto:'Matinta',texto:'No início do seu turno: cura 2 do seu herói.',sabor:'Prometa um café e o assobio vai embora. Quem cumpre a promessa dorme em paz.'},
  'bode-marrento':{nome:'Corpo-Seco',curto:'Corpo-Seco',texto:'Pisotear.',sabor:'Nem a terra quis ficar com ele. Por isso ele anda.'},
  'cerca-de-pedra':{nome:'Tapera Assombrada',curto:'Tapera',texto:'A criatura deste terreno recebe {n} de dano a menos de cada ataque.',sabor:'Casa velha de taipa. Quem se esconde ali, os golpes não acham.'},
  'touro-trovao':{nome:'Lobisomem',curto:'Lobisomem',texto:'Ataca duas vezes.',sabor:'Sétimo filho, sexta-feira, lua cheia. O resto você já sabe.'},
  'matriarca-mugidora':{nome:'Mapinguari',curto:'Mapinguari',texto:'Pisotear. Ao entrar: suas outras criaturas ganham +2/+2.',sabor:'Um olho só, uma boca na barriga e um grito que a floresta inteira obedece.'},
  'bezerro-manhoso':{nome:'Lobinho da Lua',curto:'Lobinho',texto:'Ao entrar: ganha +1/+1 se tiver uma criatura das Assombrações vizinha.',sabor:'Ainda não uiva direito. Perto da matilha, fica valente.'},
  'jegue-carregador':{nome:'Bradador',curto:'Bradador',texto:'Ao entrar: compre 1 carta.',sabor:'Lá do Sul vem um grito no meio da noite. Ele sempre traz notícia.'},
  'porco-comilao':{nome:'Capelobo',curto:'Capelobo',texto:'Sempre que uma criatura rival cair, ganha +1 ATK.',sabor:'Focinho de tamanduá, fome de dez. Nhac.'},
  'vaqueiro-aboiador':{nome:'Aboiador da Noite',curto:'Aboiador',texto:'Grito: suas Assombrações acordam e ganham +1 ATK neste turno.',sabor:'O aboio dele não chama boi. Chama o que vive no escuro.'},
  'boi-bumba':{nome:'Mula sem Cabeça',curto:'Mula',texto:'Pisotear. Grito: suas outras criaturas ganham +1/+1. As que entrarem depois também ganham.',sabor:'Onde devia ter cabeça, tem fogo. E o galope dela acorda a noite inteira.'},
  // Arraial (neutro)
  'pintinho-valente':{nome:'Bem-te-vi Valente',curto:'Bem-te-vi',texto:'Fúria.',sabor:'Pequeno no tamanho, gigante no grito: bem-te-vi!'},
  'adubo-magico':{nome:'Garrafada',curto:'Garrafada',texto:'Uma criatura sua ganha +{n}/+2.',sabor:'Raiz, casca e folha na garrafa. O gosto é ruim, o efeito é ótimo.'},
  'gato-do-celeiro':{nome:'Romãozinho',curto:'Romãozinho',texto:'Ao entrar: causa 1 de dano à criatura da frente.',sabor:'Moleque que nunca cresceu. Joga pedra no telhado e some no escuro.'},
  'moinho-de-vento':{nome:'Fogueira do Arraial',curto:'Fogueira',texto:'No início do seu turno: ganhe +{n} de energia.',sabor:'Enquanto a fogueira arde, o arraial não para.'},
  'vira-lata-caramelo':{nome:'Caramelo Caça-Visagem',curto:'Caramelo',texto:'Guarda.',sabor:'Late para o que ninguém vê. E ninguém passa.'},
  'danca-da-chuva':{nome:'Ciranda',curto:'Ciranda',texto:'Suas criaturas ganham +0/+{n} e curam toda a vida.',sabor:'Uma roda que não acaba, na beira do mar. Quem entra sai inteiro.'},
  'trator-vermelho':{nome:'Carro de Boi Fantasma',curto:'Carro de Boi',texto:'No início do seu turno: a criatura deste terreno ganha Pisotear e +{n} ATK neste turno.',sabor:'Ouve-se o chiado da roda antes de ver. Velho, barulhento e nunca falhou.'},
  'sanfoneiro-do-forro':{nome:'Saci-Pererê',curto:'Saci',texto:'Enquanto ele estiver em campo, seu Combo começa na 2ª carta do turno.',sabor:'Um redemoinho, uma risada, e tudo acontece mais rápido.'}
 },
 /* artigo das fichas no Diário ("Nasceu um Pequi...") */
 fichaArt:{cereja:'um',filhote:'um',zangao:'um',girino:'um'},
 familias:{
  aves:{nome:'Agouros',ic:'pena'},
  bichinhos:{nome:'Miúdos',ic:'asa'},
  brejeiros:{nome:"Povo d'Água",ic:'gota',cor:'#5EC8D8'},
  rebanho:{nome:'Assombrações',ic:'lua',cor:'#B9A6F0'},
  roca:{nome:'Filhos da Terra',ic:'broto'},
  sitio:{nome:'Andarilhos',ic:'chapeu',cor:'#C9A27A'}
 },
 duplas:{
  'mel-dourado':{nome:'Mel de Jataí',txt:'A Jataí ganha +2/+2 e seu herói cura 3.'},
  'leite-com-mel':{nome:'Café com Mel',txt:'Seu herói cura 4 e as duas ganham +0/+2.'},
  'susto-no-milharal':{nome:'Agouro na Porteira',txt:'As criaturas rivais da frente das duas perdem 1 de ATK.'},
  'estouro-da-boiada':{nome:'Debandada Assombrada',txt:'As duas acordam e ganham +1 ATK neste turno.'},
  'coro-do-brejo':{nome:'Canto da Iara',txt:'Causa 1 de dano a cada criatura rival.'},
  'pomar-em-flor':{nome:'Mata Curada',txt:'Cura toda a vida das suas criaturas e 3 do seu herói.'},
  'fuba-fresquinho':{nome:'Lenha na Fogueira',txt:'Ganhe +2 de energia agora.'},
  'curral-seguro':{nome:'Visagem na Tapera',txt:'A Visagem ganha +1/+3.'},
  'tempestade-de-verao':{nome:'Noite de Relâmpago',txt:'Causa 1 de dano a cada criatura rival e 2 no herói rival.'},
  'gato-e-cachorro':{nome:'Pedrada e Latido',txt:'Cada um causa 2 de dano à criatura rival da frente dele.'},
  'bom-dia-fazenda':{nome:'Alvorada de Fogo',txt:'Suas criaturas ganham +1 ATK neste turno.'},
  'mae-e-filho':{nome:'Afilhado da Matinta',txt:'O Lobinho ganha +2/+2 e seu herói cura 2.'},
  'forro-no-terreiro':{nome:'Aboio no Redemoinho',txt:'Suas criaturas ganham +1/+1.'},
  'trator-turbinado':{nome:'Carona Assombrada',txt:'O Corpo-Seco ganha +1 ATK e acorda.'},
  'ninho-seguro':{nome:'Ninhada de Brasas',txt:'Nasce um Filhote 1/1 com Fúria em cada terreno vazio seu.'},
  'arraia-do-boi':{nome:'Galope no Redemoinho',txt:'Suas criaturas acordam e ganham +1 ATK neste turno. Seu herói cura 3.'},
  'serenata-do-brejo':{nome:'Serenata do Igapó',txt:'As criaturas rivais da frente das duas ficam Enraizadas.'},
  'enxame-real':{nome:'Revoada de Marimbondos',txt:'Seus Miúdos ganham +1/+1.'}
 },
 rivais:{
  pipoca:{nome:'Zé Candeeiro, o Vigia Aprendiz',curto:'Zé Candeeiro',jeito:'Menino vigia que ainda tem medo do escuro.'},
  tonico:{nome:'Severino Gibão',curto:'Severino',jeito:'Vaqueiro valente do sertão, de gibão de couro e riso fácil.'},
  ameixa:{nome:'Raimunda Mateira',curto:'Raimunda',jeito:'Mateira que conhece cada trilha da mata.'},
  lodoso:{nome:'Seu Juca Tarrafa, o Pescador',curto:'Seu Juca',jeito:'Pescador do igapó que já viu a Boiúna duas vezes.'},
  lanuda:{nome:'Seu Agenor, o Benzedor',curto:'Seu Agenor',jeito:'Benzedor da tapera: diz que espanta visagem com um ramo de arruda.'},
  trovoada:{nome:'A Cuca, Senhora dos Pesadelos',curto:'A Cuca',jeito:'A velha bruxa das cantigas de ninar. Na Arena 5, ela vem buscar.'},
  zeca:{nome:'Zeca Cordel, o Repentista',curto:'Zeca',jeito:'Poeta de cordel que provoca em rima.'},
  cocada:{nome:'Tia Jataí, a Meleira',curto:'Tia Jataí',jeito:'Tira mel de cortiço sem levar uma picada.'},
  sanfona:{nome:'Mestre Tião Violeiro',curto:'Mestre Tião',jeito:'Violeiro campeão das pelejas. Dizem que aprendeu com o Saci.'}
 },
 heroi:{nome:'Você',titulo:'Andarilho das Lendas'},
 mentora:{nome:'Vó Zinha Candeia',curto:'Vó Zinha',jeito:'Contadora de causos.'},
 arenas:{
  1:{nome:'Porteira do Sertão',novas:'Sertão, Noite e Arraial'},
  2:{nome:'Mata Fechada',novas:'Mata'},
  3:{nome:'Beira do Igapó',novas:'Águas'},
  4:{nome:'Tapera da Meia-Noite',novas:'Carro de Boi, Ninho de Brasas, Saci e mais'},
  5:{nome:'Arraial das Lendas',novas:'As grandes lendas'}
 },
 packs:{semente:{nome:'Pacote Causo',curto:'Causo'},colheita:{nome:'Pacote Mata Adentro',curto:'Mata Adentro'}},
 baus:{madeira:'Bornal',prata:'Arca de Prata',ouro:'Botija',encantado:'Botija Encantada',lendario:'Botija da Mãe-do-Ouro'},
 tesouro:{nome:'tesouro',plural:'tesouros'},
 oddsNome:{epica:'Épica ou melhor (Botija Encantada)',lendaria:'Lendária (Botija da Mãe-do-Ouro)'},
 regras:{
  chuva:{nome:'Mata em Flor',txt:'Todas as criaturas têm Brotar.',ic:'broto'},
  seca:{nome:'Maré de Breu',txt:'Os terrenos de Águas viram Noite, e os de Noite viram Águas.',ic:'lua-onda'},
  ventania:{nome:'Ventania',txt:'Voar não funciona: toda criatura ataca a da frente.',ic:'vento'},
  feira:{nome:'Arraial Aceso',txt:'Os dois lados ganham +1 de energia em todo turno.',ic:'fogueira'},
  corvos:{nome:'Noite dos Agouros',txt:'Criaturas com Voar ganham +1 ATK.',ic:'pena'},
  lua:{nome:'Lua Cheia',txt:'Toda criatura entra acordada, mas no turno em que entra só ataca criaturas.',ic:'lua'},
  colheita:{nome:'Meia-Noite Adiantada',txt:'A Meia-Noite começa na rodada 5.',ic:'relogio'},
  mutirao:{nome:'Mutirão',txt:'Os dois começam com 6 cartas na mão.',ic:'maos'},
  familias:{nome:'Reunião dos Bandos',txt:'O bônus de família maior já vale com 2 criaturas.',ic:'familia'},
  duplas:{nome:'Dia das Duplas',txt:'Duplas valem em qualquer terreno seu, não só vizinhas.',ic:'dupla'},
  cerca:{nome:'Couro Grosso',txt:'Toda criatura entra com +0/+1.',ic:'chapeu'}
 },
 missoes:{
  vencer2:'Vença 2 partidas',criaturas12:'Invoque 12 criaturas',feiticos5:'Use 5 feitiços',dano40:'Cause 40 de dano no herói rival',
  abates10:'Derrote 10 criaturas rivais',baus2:'Abra 2 tesouros',pacote1:'Abra 1 pacote',melhorar1:'Melhore 1 carta',
  negocio1:'Faça 1 negócio na Feira',queimar3:'Queime 3 cartas na fogueira',dupla1:'Faça 1 dupla',combo2:'Faça 2 Combos x3',
  treino1:'Faça 1 treino',desafio1:'Vença o Desafio da Lua'
 },
 modos:{arena:'Arena',treino:'Treino',desafio:'Desafio da Lua',torneio:'Peleja das Lendas'},
 /* nomes das etapas da Peleja (só na tela: TORNEIO.etapas[].nome fica como está, o teste fixa 'Torneio · Primeira rodada') */
 etapas:['Primeira peleja','Semifinal','Grande Peleja'],
 lugares:{mercado:'Feira',loja:'Loja',mascate:'Mascate',vila:'Vila',vilaNome:'Vila das Lendas',causos:'Livro de Causos',codex:'Códex das Lendas',diario:'Diário',
  trilha:'Trilha das Lendas',faixa:'Fita da Peleja',feirantes:'Feirantes',queimar:'queimar na fogueira'},
 meiaNoite:{nome:'Meia-Noite',banner:'Meia-Noite!',sub:'+1 de ataque e Pisotear'},
 combo:{sub:'As lendas se juntam: +1 ATK'},
 kwTip:{voar:'Ataca o herói rival por cima da criatura da frente, a não ser que ela também tenha Voar (ou seja o Vigia da Porteira).'},
 rotulo:{raiz:'Enraizada: presa no lugar (raiz, visgo ou encanto). Não ataca no próximo combate do dono.'},
 robos:['Tonhão','Zuleica','Bentinho','Cacilda','Juvêncio','Mariquinha','Ditinho','Florinda'],
 asc:{tiers:['Desperta','Assombrosa','Lenda Viva'],glifo:['☾','☾☾','✦']},
 tut:{
  t2:'Oi, sou a Vó Zinha! Toque na Fagulha Saltadeira.',
  t3:'Agora toque num Sertão (laranja). Mesma cor: +1/+1!',
  t4:'Agora o Bem-te-vi Valente no terreno 2.',
  t5:'Cada criatura ataca o que está na frente dela. Se estiver vazio, o ataque vai direto no rival. Esses dois têm Fúria: atacam já. Toque em Atacar!',
  t6:'A Fagulha dele bateu primeiro, e quem apanha não revida! Use a Chuva de Brasa na Fagulha do rival.',
  t7:'Agora, Atacar!',
  t8:'Criaturas sem Fúria descansam (zZz) no turno em que chegam. Jogue a Acauã Agourenta num Sertão e a Visagem no terreno 4. Depois, Atacar!',
  t9:'Viu? Com Voar, a Acauã do Zé Candeeiro passou por cima da sua Visagem. Agora a sua Acauã acordou e não tem ninguém na frente: ataque e vença!'
 },
 causos:{} // as 60 páginas do Livro de Causos (preenchidas mais abaixo)
};
/* atalhos de texto para a interface (Vinténs / VINTÉNS / Brasas) */
const MOE=TEMA.moeda.plural,MOEC=TEMA.moeda.caps,BRAS=TEMA.po.plural;
/* "GRÃO insuficiente" (motivo interno, fixado em teste) -> "VINTÉNS insuficientes"; "Pó" -> "Brasas" */
function txtMoeda(m){
  if(m==null)return m;m=String(m);
  return m.replace(/GRÃO insuficiente\b/g,TEMA.moeda.caps+' insuficientes').replace(/GRÃO/g,TEMA.moeda.caps).replace(/Grão/g,TEMA.moeda.plural)
   .replace(/(^|[^\wÀ-ÿ])Pó(?![\wÀ-ÿ])/g,'$1'+TEMA.po.plural);
}
/* selo do modo na tela (troca 'Torneio · Primeira rodada' por 'Peleja · Primeira peleja') */
function descModoTema(B){
  if(!B||B.tut)return '';
  if(B.modo==='treino')return TEMA.modos.treino;
  if(B.modo==='desafio')return 'Desafio';
  if(B.modo==='torneio'){const e=TEMA.etapas[B.etapa];return 'Peleja'+(e?' · '+e:'');}
  return '';
}
/* nome de etapa interno ('Primeira rodada') -> nome na tela ('Primeira peleja') */
function nomeEtapaTxt(n){const i=TORNEIO.etapas.findIndex(e=>e.nome===n);return i>=0&&TEMA.etapas[i]?TEMA.etapas[i]:n;}
(function aplicarTema(T){
  Object.assign(TERR_NOME,T.terr);Object.assign(TERR_COR,T.terrCor);
  for(const id in T.cartas){const c=CARD[id];if(!c)continue;const t=T.cartas[id];c.nome=t.nome;c.curto=t.curto||t.nome;if('texto' in t)c.texto=t.texto;if('sabor' in t)c.sabor=t.sabor;}
  Object.assign(FICHA_ART,T.fichaArt);
  for(const k in T.familias)if(FAMILIAS[k])Object.assign(FAMILIAS[k],T.familias[k]);
  for(const id in T.duplas)if(DUPLA[id])Object.assign(DUPLA[id],T.duplas[id]);
  for(const k in T.rivais)if(RIVAIS[k])Object.assign(RIVAIS[k],T.rivais[k]);
  for(const n in T.arenas){const a=ARENAS[n-1];if(a)Object.assign(a,T.arenas[n]);}
  for(const k in T.packs)if(PACKS[k])Object.assign(PACKS[k],T.packs[k]);
  for(const k in T.baus)if(BAUS[k])BAUS[k].nome=T.baus[k];
  Object.assign(ODDS_NOME,T.oddsNome);
  for(const id in T.regras)if(REGRA[id])Object.assign(REGRA[id],T.regras[id]);
  for(const id in T.missoes)if(MISSAO[id])MISSAO[id].txt=T.missoes[id];
  Object.assign(MODO_NOME,T.modos);
  for(const k in T.kwTip)if(KW_INFO[k])KW_INFO[k].tip=T.kwTip[k];
  for(const k in T.rotulo)if(ROTULO_INFO[k])ROTULO_INFO[k].tip=T.rotulo[k];
  ROBOS.splice(0,ROBOS.length,...T.robos);
})(TEMA);
/* ---- Livro de Causos: 60 páginas (região, causo em voz de contadora, "Você sabia?") ---- */
Object.assign(TEMA.causos,{
 // ===== Sertão =====
 'espiga-sapeca':{regiao:'Sertão nordestino',texto:'Escuta essa. Seu Bastião limpava a roça com fogo, como o avô ensinou, e na hora de apagar a coivara uma fagulha deu um pulo e não voltou. Desde então ela anda de toco em toco, atrás de quem deixa fogo sem vigia. Não queima casa, não queima gente. Só pula na frente do descuidado, faz um estalo e some. Quem viu, nunca mais esqueceu de jogar terra na brasa.',sabia:'Coivara é o nome antigo da queima dos galhos que sobram quando se limpa um pedaço de mata para fazer roça.'},
 'corvo-ladino':{regiao:'Nordeste',texto:'Lá no sertão, meu filho, ninguém gosta de ouvir a acauã rir no galho seco. É uma risada comprida, que parece de gente, e o povo diz que ela chama a seca. Uma vez, em Quixadá, ela riu três dias seguidos e o açude baixou um palmo por dia. Dizem também que ela tem o bico cheio de moedinhas roubadas. Eu nunca contei, que não sou besta de chegar perto.',sabia:'A acauã é um falcão de verdade (Herpetotheres cachinnans). Ela come cobras, e o canto dela é tido como agouro em boa parte do Nordeste.'},
 'chuva-de-graos':{regiao:'Sertão',texto:'Teve um ano em que o céu esqueceu de chover. Quando as nuvens enfim apareceram, vieram vermelhas, e em vez de água caiu brasa miúda, feito chuvisco. Os velhos dizem que foi o sertão devolvendo todo o calor que tinha guardado. Os bichos se esconderam nas locas de pedra e só os mandacarus ficaram de pé, de braço aberto, como quem diz: pode vir, que eu aguento.',sabia:'Caatinga vem do tupi e quer dizer "mata branca": é a cor dos galhos secos na estiagem.'},
 'espantalho-guardiao':{regiao:'Sertão',texto:'Seu Vigia não dorme. Fica na porteira com o candeeiro aceso, a vara comprida na mão e o chapéu de couro na cabeça. Coruja, morcego, até visagem que voa baixo, tudo dá meia-volta quando vê aquela luzinha. Dizem que um dia o vento apagou o candeeiro. Ele não se mexeu: só olhou firme pro escuro, e o escuro, com vergonha, recuou sozinho.',sabia:'O vaqueiro do sertão usa gibão, perneiras e chapéu de couro para atravessar a caatinga cheia de espinhos.'},
 'vento-dourado':{regiao:'Brasil todo',texto:'Ao meio-dia, quando o sol está a pino, o vento resolve dançar. Levanta poeira vermelha, folha seca, palha de milho, e sai rodando pelo quintal e pela estrada, sem pedir licença a ninguém. O povo jura que lá no meio vai o Saci, de gorro vermelho, rindo. Quem estava cochilando acorda; quem estava com preguiça sai correndo. Redemoinho não deixa ninguém parado.',sabia:'No Nordeste, o redemoinho de poeira também é chamado de "pé de vento".'},
 'pipoqueiro-explosivo':{regiao:'Caatinga',texto:'Esse mandacaru nasceu numa noite de fogueira grande. Bebeu tanto calor que ficou com brasa por dentro, correndo nas rachaduras feito rio de lava. De dia é só mais um cacto. De noite, se alguém tenta derrubar, ele estala e solta faísca para todo lado. Os vaqueiros respeitam: passam longe e tiram o chapéu. É o jeito do sertão de dizer obrigado a quem segura a terra.',sabia:'Diz o povo que, quando o mandacaru floresce na seca, a chuva está chegando no sertão.'},
 'revoada-noturna':{regiao:'Nordeste e Sudeste',texto:'Ela passa de madrugada, branca como lençol, e solta um grito que parece pano rasgando. Por isso o nome: rasga-mortalha. Antigamente, quando ela pousava no telhado, a casa inteira acordava e ninguém voltava a dormir. Eu digo que ela só está caçando rato para o jantar, coitada. Mas confesso: quando escuto aquele "chrrrr" no escuro, puxo o lençol até o nariz.',sabia:'A rasga-mortalha é a suindara, uma coruja de cara em forma de coração. Ela caça ratos e ajuda muito quem planta.'},
 'rei-milhao':{regiao:'Sul (pampa) e Brasil todo',texto:'Quando a mata pega fogo por maldade, uma cobra de fogo acorda debaixo da terra. É o Boitatá. Tem os olhos enormes, brilhando como dois faróis, e vem rastejando pelo campo atrás de quem queimou o que não devia. No pampa, os gaúchos contam que ele passa pelos banhados sem fazer barulho. Quem cuida da mata pode ficar tranquilo: o fogo dele só procura quem destrói.',sabia:'O nome vem do tupi: mboi (cobra) e tatá (fogo). Um dos primeiros registros escritos é de 1560, numa carta do padre José de Anchieta.'},
 'codorna-ninheira':{regiao:'Amazônia e Brasil todo',texto:'Ó, meu filho, olha aquele galho seco na ponta da cerca. Olhou? Pois não é galho, é a mãe-da-lua. Ela fica parada o dia inteiro, de bico pro céu, e ninguém nota. Quando a lua sobe, ela abre os olhos amarelos, grandes como duas moedas, e canta um choro comprido. Dizem que chora pelo filhote que caiu do ninho. Por isso ela cuida tanto dos que ficaram.',sabia:'A mãe-da-lua é o urutau (Nyctibius griseus). Ele se disfarça tão bem de toco que o ninho dele é só um buraquinho no galho.'},
 'pamonha-quentinha':{regiao:'Nordeste',texto:'Dona Lurdes tinha uma pimenta no quintal que ninguém conseguia comer inteira. Era vermelha, gordinha e tinha cara de brava, juro. Um dia o neto dela estava com tanto sono que não levantava da rede. Ela esfregou uma pimentinha na ponta do pão e deu pro menino. Ele pulou da rede, correu até o açude e voltou acordado para a semana inteira.',sabia:'As pimentas do gênero Capsicum nasceram nas Américas e já eram cultivadas pelos povos daqui muito antes da chegada dos portugueses.'},
 'galo-despertador':{regiao:'Nordeste',texto:'Esse galo tem a crista de fogo e o rabo de brasa. Ele não canta de madrugada como os outros: canta quando dá na telha. Meia-noite, meio-dia, hora do almoço. O povo diz que galo cantando fora de hora traz notícia. E traz mesmo: quando ele canta, todo bicho do quintal acorda de uma vez, pronto para o que vier. Até o cachorro se levanta resmungando.',sabia:'No interior, diz o ditado que galo que canta fora de hora anuncia novidade, boa ou ruim.'},
 'galinheiro':{regiao:'Caatinga',texto:'No forquilho de uma árvore velha da caatinga tem um ninho feito de graveto espinhento. Embaixo dele as brasas nunca apagam, nem na chuva. Ali dentro sempre tem um ovo pintado balançando, quase chocando. Quando um filhote sai, voa com as asinhas cor de laranja, e logo aparece outro ovo no lugar. Ninguém sabe quem bota. O sertão tem dessas coisas.',sabia:'O joão-de-barro constrói o ninho com barro e palha, e faz uma parede interna que esconde os filhotes da porta de entrada.'},
 'gaviao-real':{regiao:'Sudeste e Centro-Oeste',texto:'Nas serras de Minas, de Goiás e de São Paulo, os mineradores contavam de uma bola de fogo que riscava o céu à noite e descia devagar atrás de um morro. No dia seguinte, quem cavava naquele lugar achava ouro. Era a Mãe-do-Ouro, a guardiã dos veios. Mas cuidado: quem cava com ganância, ela leva o ouro embora de novo, e a mina seca para sempre.',sabia:'A lenda da Mãe-do-Ouro nasceu nas regiões de mineração dos séculos 17 e 18, quando a corrida do ouro mudou o interior do Brasil.'},
 // ===== Mata =====
 'maca-rolica':{regiao:'Mata Atlântica',texto:'Na beira da trilha, debaixo das samambaias, mora um brotinho redondo com duas folhas de orelha. Ele cresce um pouquinho a cada lua, sem pressa. Os mais velhos dizem que todo brotinho do mato guarda a semente de uma árvore grande. Por isso a gente pisa com cuidado na mata: nunca se sabe se aquele brotinho miúdo vai ser, daqui a cem anos, a árvore mais alta do morro.',sabia:'Restam pouco mais de 12% da cobertura original da Mata Atlântica, e cada pedacinho em pé abriga espécies que só existem aqui.'},
 'abelha-operaria':{regiao:'Brasil todo',texto:'A jataí é pequenininha e não tem ferrão, mas não se engane: é corajosa. Na porta da casa dela tem um canudinho de cera, e lá ficam as guardiãs, de prontidão. Minha avó guardava o mel de jataí num vidrinho e passava nos olhos e nos machucados das crianças. Mel pouco, mas precioso. Quem tem um cortiço de jataí no quintal tem remédio e tem companhia.',sabia:'A jataí (Tetragonisca angustula) é uma abelha nativa sem ferrão. A entrada do ninho é um tubinho de cera que ela fecha à noite.'},
 'orvalho-da-manha':{regiao:'Mata Atlântica',texto:'Antes do sol nascer, a mata acorda molhada. Cada folha de costela-de-adão segura uma gota grande, redonda, cheia de luz. Contam que quem bebe o orvalho da primeira folha que o sol tocar fica forte o dia inteiro. Eu já tentei, mas sempre chega um passarinho antes. A mata é assim: divide tudo, até a gota do café da manhã.',sabia:'Na Mata Atlântica, muitas bromélias guardam água entre as folhas, e ali vivem girinos, insetos e até pererecas inteiras.'},
 'cerejas-gemeas':{regiao:'Cerrado',texto:'No cerrado, quando o pequizeiro solta os frutos, eles caem de dois em dois, rolando morro abaixo e rindo. São os pequis gêmeos, que nunca se separam. O cheiro deles chega longe e chama todo mundo para a festa. Mas atenção, meu filho: pequi não se morde. Se rói devagarinho, porque lá dentro tem espinho fino. Quem esquece disso, aprende rápido.',sabia:'O pequi (Caryocar brasiliense) tem uma camada de espinhos finos ao redor da semente. Por isso se rói a polpa, sem morder.'},
 'joaninha-curandeira':{regiao:'Brasil todo',texto:'Quando a lamparina fica acesa na varanda, chega uma mariposa branca de asas verdes, com dois olhos desenhados nas costas. Ela dá uma volta em cada um da casa, devagarinho, e onde passa a asa, o arranhão fecha e a dor de barriga passa. Não precisa chamar, nem agradecer em voz alta. Basta deixar a luz acesa e a janela aberta.',sabia:'Em muitos lugares do Brasil, a mariposa grande e escura que entra em casa é chamada de "bruxa".'},
 'colmeia-dourada':{regiao:'Brasil todo',texto:'No toco oco da mangueira velha, as jataís fizeram morada. O tronco é tão antigo que tem desenho de sol entalhado, ninguém sabe por quem. Dali escorre um mel dourado que deixa forte quem dorme por perto. Os bichos da mata sabem disso: quando estão cansados, vão descansar ao lado do cortiço e acordam inteiros. Doce é o trabalho de muitas.',sabia:'Cortiço é o nome popular da colmeia de abelhas sem ferrão feita num tronco oco. Criar essas abelhas se chama meliponicultura.'},
 'macieira-ancia':{regiao:'Amazônia e Mata Atlântica',texto:'Se você entrar na mata e de repente não achar o caminho de volta, pare. Olhe o chão. Está vendo pegadas? Repare que os dedos apontam para trás. É o Curupira, de cabelo vermelho como fogo, protegendo a floresta. Quem caça só o que precisa, ele deixa em paz. Quem derruba árvore à toa, ele faz andar em círculo até cansar e prometer nunca mais.',sabia:'O Curupira aparece numa carta do padre José de Anchieta de 1560, um dos registros mais antigos de uma lenda brasileira.'},
 'guardia-florada':{regiao:'Brasil todo (Nordeste e Sudeste)',texto:'A Caipora vem montada num caititu grandão, de dente branco e crina arrepiada, e com ela vem um barulho de folha mexendo. Ela é a dona dos bichos do mato. Cura o veado ferido, esconde o tatu do caçador e dá bronca no menino que mexe em ninho. Quem caça demais se perde na mata e só acha o rumo quando pede desculpas para a floresta.',sabia:'Em muitas regiões, a Caipora e o Curupira se confundem. No Nordeste, ela costuma aparecer montada num porco-do-mato.'},
 'pe-de-maracuja':{regiao:'Brasil todo',texto:'Essa erva não tem raiz na terra. Nasce lá em cima, no galho das outras árvores, e vai subindo e se espalhando. Quem planta é o passarinho: come a frutinha vermelha, voa para outra árvore e a semente gruda no galho. Por isso o nome, erva-de-passarinho. Ela é teimosa, sim, mas é generosa: onde ela chega, todo mundo começa a crescer junto.',sabia:'A erva-de-passarinho é uma planta parasita: tira água e sais das árvores onde cresce, e é espalhada pelas aves que comem seus frutos.'},
 'formiga-carregadeira':{regiao:'Brasil todo',texto:'A saúva sai da toca antes do sol e volta carregando uma folha maior que ela, levantada feito escudo. Uma vez vi uma fila tão comprida que atravessava a estrada inteira, e nenhum caminhão passou até a última formiga chegar do outro lado. Elas não comem as folhas, viu? Levam para dentro e plantam um fungo. São roceiras, iguais à gente.',sabia:'As saúvas cultivam fungos em câmaras subterrâneas usando as folhas que cortam. Um formigueiro grande pode ter milhões de formigas.'},
 'cipo-enrolado':{regiao:'Amazônia',texto:'O matapau começa pequeno, pendurado num galho alto como quem não quer nada. Aí desce uma raiz, depois outra, e vai abraçando o tronco da árvore. Abraça, abraça, aperta. Os anos passam e, quando a árvore velha cai de cansada, quem fica em pé é ele, com o formato oco dela por dentro. A mata ensina: nem todo abraço é carinho.',sabia:'Várias figueiras da Amazônia são "mata-paus": nascem sobre outras árvores e as envolvem com raízes até tomar o lugar delas.'},
 'louva-a-deus':{regiao:'Nordeste',texto:'No Nordeste, chamam esse bicho de põe-mesa. Ele fica parado com as patas da frente dobradas, quietinho, como quem vai servir o almoço. As crianças perguntam onde é a festa e ele vira a cabeça triangular devagar, olhando bem nos olhos. Mas não se engane com a pose de educado. Ele está é mirando, e quando a mosca chega perto, a mesa está posta.',sabia:'O louva-a-deus consegue virar a cabeça quase 180 graus, coisa rara entre os insetos.'},
 'abelha-rainha':{regiao:'Brasil todo',texto:'Na beira da roça tem uma casa de papel cinza pendurada no galho. É a casa da Rainha-Marimbondo. Ela não mexe com ninguém, mas se alguém cutuca o ninho com vara, sai um enxame zunindo que nem trovoada, e não para até o abelhudo pular no açude. Por isso, quando alguém procura confusão à toa, o povo avisa: não vai mexer em casa de marimbondo.',sabia:'"Mexer em casa de marimbondo" é uma expressão brasileira que quer dizer provocar uma confusão desnecessária.'},
 // ===== Águas =====
 'sapinho-verruguento':{regiao:'Amazônia',texto:'Na beira do igarapé mora um sapinho azul-esverdeado com as costas cheias de bolinhas que brilham de noite. Os peixes grandes acham que é petisco. Mordem uma vez e cospem na hora, com a boca ardendo. Desde então o sapinho canta tranquilo, toda noite, na folha de vitória-régia, pois todo mundo do rio já aprendeu a lição: quem morde, se arrepende.',sabia:'Igarapé vem do tupi e quer dizer "caminho de canoa": são os riachos estreitos que cortam a floresta amazônica.'},
 'libelula-faisca':{regiao:'Interior do Brasil',texto:'No interior, a libélula se chama lavadeira, porque bate a pontinha do rabo na água como quem esfrega roupa na pedra. Essa aqui é diferente: tem as asas cheias de faísca. Passa tão rápido que deixa um risco de luz no ar. Quando você olha, ela já foi e já voltou, e ainda deu tempo de beliscar o nariz do sapo-cururu.',sabia:'As libélulas põem os ovos na água, e os filhotes vivem anos debaixo d\'água antes de virar adultos voadores.'},
 'lodo-pegajoso':{regiao:'Amazônia',texto:'Na época da cheia, a floresta inteira entra no rio, e o chão vira lodo preto, mole e grudento. Quem anda por ali com pressa pisa errado e afunda até o joelho. O lodo não devolve nem bota, nem coragem. Os pescadores dizem que o igapó tem paciência: ele espera o forte cansar, e aí segura. Por isso, no igapó, se vai devagar, de canoa.',sabia:'Igapó é a floresta que fica alagada na cheia dos rios de água escura, como o Rio Negro, às vezes por vários meses.'},
 'taboa-espinhosa':{regiao:'Amazônia (várzea)',texto:'Na várzea cresce a aninga, alta, de folha em forma de seta, balançando bonita com o vento. De longe é a coisa mais linda do rio. De perto também, só que o caule é cheio de espinho e a seiva arde na pele. A aninga não faz mal a ninguém de propósito. Só não gosta de ser arrancada. Quem respeita, passa de canoa e ganha sombra.',sabia:'A aninga (Montrichardia linifera) forma grandes touceiras nas margens dos rios amazônicos e ajuda a segurar a terra da beira.'},
 'garca-pescadora':{regiao:'Pantanal',texto:'O tuiuiú fica parado na água rasa, de pernas compridas, olhando para baixo. Passa uma hora. Passam duas. Os peixinhos começam a achar que é um tronco. Aí, numa piscada, desce aquele bico enorme feito lança, e o almoço está garantido. Quando ele abre as asas e sobe do Pantanal, faz sombra no barco inteiro. Paciência de pedra, bico de lança.',sabia:'O tuiuiú (Jabiru mycteria) é a ave-símbolo do Pantanal e pode passar de 2,5 metros de uma ponta da asa à outra.'},
 'atoleiro':{regiao:'Amazônia',texto:'O rio estava calmo como espelho quando o banzeiro chegou. Primeiro uma onda pequena, depois outra maior, e mais outra, batendo na beira e sacudindo as palafitas. A canoa do Seu Juca rodou três vezes e ele só não foi junto porque se agarrou num galho de assacu. O banzeiro não pede licença e não tem dono. É o rio lembrando quem manda.',sabia:'Na Amazônia, banzeiro é o nome das ondas fortes do rio, levantadas pelo vento ou pela passagem dos barcos grandes.'},
 'rainha-das-ras':{regiao:'Amazônia e Brasil todo',texto:'Nos fins de tarde, quando o rio fica cor de cobre, se ouve um canto que vem de longe, por cima da água. É a Iara, com cabelo que parece água correndo e coroa de concha e flor de aguapé. Quem escuta sente vontade de ir atrás. Os pescadores sabidos tapam os ouvidos com cera e remam firme para casa. O rio inteiro canta junto com ela.',sabia:'Iara vem do tupi y-îara, "senhora das águas". Cronistas do século 16 já falavam de seres das águas temidos pelos povos daqui.'},
 'velho-lodao':{regiao:'Amazônia',texto:'Numa noite sem lua, Seu Juca viu as luzes de um barco grande descendo o rio. Acenou, gritou, ninguém respondeu. As luzes chegaram perto, bem perto, e piscaram. Não era barco. Eram os olhos da Boiúna, a Cobra-Grande, tão comprida que o rabo ainda estava na curva de trás. Ele remou até o amanhecer. Desde então, só pesca de dia.',sabia:'Boiúna vem do tupi: mboia (cobra) e una (preta). Dizem que os canais e lagos da Amazônia foram abertos pelo corpo dela.'},
 'perereca-grudenta':{regiao:'Brasil todo',texto:'Essa perereca é miudinha, verde-limão, e gruda em tudo: na parede do banheiro, no vidro da janela, na testa de quem está distraído. Os dedinhos dela têm umas bolinhas que seguram firme até de cabeça para baixo. Quando ela gruda num bicho grande e brigão, ele fica tão sem graça que perde a vontade de brigar. Gruda primeiro, pergunta depois.',sabia:'As pererecas têm discos adesivos nas pontas dos dedos, que deixam subir em folhas, troncos e até em vidro liso.'},
 'vaga-lume-piscante':{regiao:'Brasil todo',texto:'Nas noites quentes, no meio do brejo, aparece uma luzinha azul que pisca e se afasta. Pisca e se afasta. Quem segue a luz acaba com o pé na lama e a calça molhada. Os antigos chamavam de fogo-fátuo e diziam que era alma perdida procurando caminho. Eu digo só uma coisa, meu filho: luz que foge de você não quer ser pega. Deixa ela.',sabia:'O fogo-fátuo de verdade é uma chama fraca causada por gases que saem de matéria apodrecendo em pântanos. Em alguns lugares é chamado de boitatá.'},
 'sapo-cururu':{regiao:'Brasil todo (cantiga popular)',texto:'Sapo-cururu, na beira do rio... Toda criança do Brasil já cantou. O que pouca gente sabe é que o cururu escuta. Quando a cantiga começa, ele estufa o papo, que brilha de leve feito lanterna, e responde com um ronco grosso. E aí, de todo canto da beira, aparecem os girinos para ver o concerto. Cada noite de cantoria, a família dele aumenta.',sabia:'A cantiga "Sapo-cururu" é uma das canções de ninar mais conhecidas do Brasil e já foi gravada em muitas versões.'},
 'cagado-ranzinza':{regiao:'Amazônia',texto:'O tracajá velho tem cem anos de rio e sobrancelha branca comprida. Já viu cheia, já viu seca, já viu menino virar avô. Reclama de tudo: do sol forte, da água fria, do barulho dos barcos. Mas quando os pequenos se escondem atrás do casco dele, ele não arreda pé. Ranzinza por fora, abrigo por dentro. Cem anos de rio, cem anos de mau humor.',sabia:'O tracajá (Podocnemis unifilis) desova nas praias de areia que aparecem quando o rio baixa, na época da seca.'},
 'sucuri-do-charco':{regiao:'Amazônia',texto:'Na festa junina da comunidade apareceu um moço de terno branco e chapéu que não tirava por nada. Dançou com todo mundo, contou causo, fez a roda rir até a sanfona cansar. Quando o dia clareou, ninguém lembrava do nome dele, nem do que tinha acontecido. Só viram um boto cor-de-rosa pulando no rio, com uma fita da festa enrolada na nadadeira.',sabia:'O boto-cor-de-rosa (Inia geoffrensis) vive nos rios da Amazônia. Na lenda, ele usa chapéu para esconder o furinho de respirar no alto da cabeça.'},
 // ===== Noite =====
 'ovelha-felpuda':{regiao:'Amazônia (visagem = assombração)',texto:'No Pará se diz visagem para tudo que aparece e não devia. Essa aqui flutua pelos quintais como um lençol esquecido no varal, com uma luzinha fraca no peito e dois olhos ocos. Já tentaram espantar com vassoura, com grito, com pedra. Tudo atravessa e ela fica. Não faz mal a ninguém. Só fica, olhando, até a gente se acostumar.',sabia:'Visagem é a palavra usada na Amazônia, principalmente no Pará, para qualquer assombração ou aparição.'},
 'cabrito-teimoso':{regiao:'Nordeste',texto:'Toc, toc, toc. Lá fora uma voz canta: "Eu sou a Cabra-Cabriola, que come meninos aos pares..." É a Cabra-Cabriola, de olho de brasa e chifre torto, batendo de porta em porta nas noites escuras. Ela só entra se alguém abrir. Por isso, nas casas do sertão, as mães ensinam desde cedo: de noite, ouviu canto na porta, não abre. Nem que peça com jeitinho.',sabia:'A Cabra-Cabriola veio de Portugal e se espalhou pelo Nordeste. O folclorista Câmara Cascudo registrou suas cantigas.'},
 'feno-fresquinho':{regiao:'Brasil todo',texto:'Depois da meia-noite, o ar esfria e desce o sereno, um orvalho fininho que cobre o mato de prata. As mães dizem para não ficar no sereno, que dá resfriado. Mas os velhos contam outra coisa: o primeiro sereno da lua cheia fecha qualquer ferida de bicho que dormiu ao relento. Quem é assombração sabe, e por isso anda tanto de madrugada.',sabia:'"Pegar sereno" é uma expressão popular: muita gente no Brasil acredita que o frio da madrugada causa gripe.'},
 'vaca-mimosa':{regiao:'Amazônia (Pará)',texto:'Fiiiiu. De madrugada, um assobio fino rodeia a casa. É a Matinta Perera. Dona Raimunda, que é de Bragança, me ensinou: você grita "Matinta, amanhã vem tomar café!". E pronto, o assobio vai embora. No outro dia, bem cedinho, aparece uma senhora de xale escuro pedindo o café prometido. Quem cumpre, dorme em paz. Quem esquece, ouve assobio a semana inteira.',sabia:'O pássaro matintaperera (Tapera naevia) existe de verdade. Em outras regiões do Brasil, por causa do assobio misterioso, ele é chamado de saci.'},
 'bode-marrento':{regiao:'Sudeste (SP e MG)',texto:'Contam no interior de São Paulo e de Minas de um homem tão ruim, mas tão ruim, que quando morreu nem a terra quis ficar com ele. O corpo foi cuspido de volta, seco, duro, com a pele de casca de árvore. Desde então o Corpo-Seco anda pelas estradas de terra, devagar, arrastando os pés. Dizem que ele só procura um lugar para descansar. Ninguém quer dar.',sabia:'A lenda do Corpo-Seco é contada no Vale do Paraíba e no sul de Minas, e serve de lição: quem faz mal em vida não encontra sossego.'},
 'cerca-de-pedra':{regiao:'Interior do Brasil',texto:'No alto do morro tem uma tapera de taipa, de telhado de palha caído e uma janela que acende sozinha. Ninguém mora lá faz muito tempo. Mas quem foge da chuva ou de bicho bravo e se esconde lá dentro, sai sem um arranhão. Os golpes não acham o caminho até a porta. Dizem que a casa velha ainda gosta de proteger quem entra.',sabia:'Tapera vem do tupi e quer dizer "aldeia que foi": um lugar abandonado. Taipa é a parede de barro socado com varas de madeira.'},
 'touro-trovao':{regiao:'Brasil todo',texto:'Sétimo filho homem, noite de sexta-feira, lua cheia no céu. O rapaz sai para o quintal, se espreguiça e começa a crescer pelo, orelha, unha. É o Lobisomem. Corre sete sítios antes do galo cantar, uiva para a lua, derruba cerca. De manhã volta a ser gente, cansado e com a camisa rasgada, sem lembrar de nada. O resto, meu filho, você já sabe.',sabia:'Em muitas regiões, a tradição diz que o sétimo filho deve ter o irmão mais velho como padrinho de batismo para não virar lobisomem.'},
 'matriarca-mugidora':{regiao:'Amazônia (Acre, Pará)',texto:'No fundo da mata do Acre vive o Mapinguari. Tem um olho só no meio da testa, pelo vermelho e grosso, costas duras como casco de jabuti, e uma boca enorme na barriga. Quando ele grita, as árvores tremem e os bichos se escondem. Seringueiros antigos juravam que sentiram o cheiro dele antes de ver. E todos voltaram correndo, sem a borracha do dia.',sabia:'Alguns pesquisadores acham que a lenda do Mapinguari pode guardar a lembrança das preguiças-gigantes que viveram na Amazônia há milhares de anos.'},
 'bezerro-manhoso':{regiao:'Brasil todo',texto:'O lobinho nasceu com uma lua desenhada na testa. Ainda tem as orelhas maiores que a cabeça e o uivo sai fino, meio engasgado. Sozinho, se esconde atrás das pedras. Mas basta ouvir a matilha chegando que ele estufa o peito, empina o focinho e uiva o mais alto que pode. Perto dos seus, todo mundo fica valente. Até lobinho de leite.',sabia:'O lobo-guará (Chrysocyon brachyurus) é o maior canídeo da América do Sul e aparece na nota de 200 reais.'},
 'jegue-carregador':{regiao:'Sul (PR e SC)',texto:'No Paraná e em Santa Catarina, os tropeiros contavam de um grito que corta a noite, vindo do mato fechado. É o Bradador, uma alma de poncho comprido que vaga sem descanso. Quem escuta o grito três vezes recebe notícia antes do sol nascer: carta, visita, novidade. Por isso ele traz uma carta enrolada na mão. Nunca diz se a notícia é boa.',sabia:'Bradar quer dizer gritar. A lenda do Bradador é contada no Paraná e em Santa Catarina, nos caminhos antigos dos tropeiros.'},
 'porco-comilao':{regiao:'Maranhão e Pará',texto:'Nas matas do Maranhão anda o Capelobo, de focinho comprido de tamanduá e pé redondo. Ele tem uma fome que não acaba nunca. Come e engorda, come e engorda, e a cada bicho que cai, fica mais forte e mais redondo. Os caçadores de lá dizem que ele só para quando acerta a barriga dele. Nhac. Ouviu esse barulho no escuro? Melhor ir para casa.',sabia:'O Capelobo é contado no Maranhão e no Pará. Diz a lenda que o único ponto fraco dele é o umbigo.'},
 'vaqueiro-aboiador':{regiao:'Sertão nordestino',texto:'O aboio é aquele canto comprido que o vaqueiro solta para chamar o gado: êêê boi, ôôô. Mas esse vaqueiro aboia de noite, de gibão escuro com beira de prata, e quem responde não é boi. São as assombrações do sertão, que saem das locas de pedra e vêm atrás dele em fila. Ele leva todas para longe das casas, e volta antes do sol.',sabia:'O aboio é um canto quase sem palavras, usado pelos vaqueiros do Nordeste para guiar o gado pela caatinga.'},
 'boi-bumba':{regiao:'Sudeste e Brasil todo',texto:'Numa noite de quinta para sexta-feira, se ouve um galope pesado pela estrada. Ferradura de prata batendo na pedra, faísca voando. É a Mula sem Cabeça, e onde devia ter cabeça, tem uma labareda que ilumina o mato. Ninguém sabe ao certo de onde veio a maldição: é coisa muito antiga. Quem vê, se joga no chão, fecha os olhos e espera o galope passar.',sabia:'Dizem que a Mula sem Cabeça corre sete povoados numa só noite. A lenda veio da Península Ibérica e ganhou jeito brasileiro.'},
 // ===== Arraial =====
 'pintinho-valente':{regiao:'Brasil todo',texto:'O bem-te-vi é pequeno, mas não leva desaforo para casa. Quando o gavião passa perto do ninho, ele sai voando atrás, bicando as costas do grandão até ele ir embora. E ainda grita, para todo mundo ouvir: bem-te-vi! bem-te-vi! E esse aqui, olha só, ainda ganhou um chapeuzinho de couro e uma espada de espinho. Pequeno no tamanho, gigante no grito.',sabia:'O bem-te-vi (Pitangus sulphuratus) ganhou o nome pelo canto. Ele é conhecido por enfrentar aves bem maiores para defender o ninho.'},
 'adubo-magico':{regiao:'Brasil todo (medicina popular)',texto:'Na feira de toda cidade tem uma banca de garrafada: garrafa de vidro cheia de raiz, casca, folha e um caldo verde que ninguém sabe a receita. A raizeira que me vendeu disse: uma colher de manhã e você fica forte que nem aroeira. O gosto é ruim que só. Mas que dá ânimo, dá. Ninguém volta para pedir o dinheiro de volta.',sabia:'Garrafadas são preparos de ervas da medicina popular brasileira, vendidas em feiras como o Ver-o-Peso, em Belém.'},
 'gato-do-celeiro':{regiao:'Goiás',texto:'Em Goiás contam do Romãozinho, um moleque que contou uma mentira tão grande que ficou amaldiçoado: nunca vai crescer e nunca vai descansar. Desde então ele anda pelas noites, de estilingue no bolso, jogando pedrinha no telhado, quebrando telha, rindo baixinho e sumindo no escuro. Quem vai atrás não acha nada. Só o eco da risada e uma pedra no chão.',sabia:'A lenda do Romãozinho é contada em Goiás. Ela ensina às crianças o tamanho do estrago que uma mentira pode fazer.'},
 'moinho-de-vento':{regiao:'Brasil todo (festas juninas)',texto:'No meio do arraial acendem a fogueira, de lenha cruzada, com bandeirinha colorida por cima. Enquanto ela arde, ninguém vai embora: tem quadrilha, tem quentão sem álcool para as crianças, tem causo contado de pé. Dizem que a fogueira do arraial dá coragem para quem dança perto dela. Eu acredito, meu filho. Já vi muito tímido virar puxador de quadrilha.',sabia:'As maiores festas juninas do Brasil acontecem no Nordeste, em cidades como Campina Grande (PB) e Caruaru (PE).'},
 'vira-lata-caramelo':{regiao:'Brasil todo',texto:'O Caramelo late para o canto vazio da sala, de pelo arrepiado, uma orelha em pé e a outra caída. Todo mundo olha e não vê nada. Mas a lanterninha no pescoço dele acende roxa, e aí a gente entende: tem visagem ali. Ele não arreda pé. Fica entre a família e o escuro, latindo até a assombração desistir. Ninguém passa pelo Caramelo.',sabia:'O vira-lata caramelo virou um símbolo popular do Brasil, e em 2020 muita gente pediu que ele estampasse a nota de 200 reais.'},
 'danca-da-chuva':{regiao:'Pernambuco',texto:'Na beira da praia, quando a maré enche, começa a ciranda. Todo mundo de mãos dadas, numa roda que gira devagar, para a esquerda, acompanhando o mar. Não importa quem você é: chegou, entra. A roda abre um espaço e fecha de novo. Dizem que quem dança a ciranda até o fim sai inteiro, curado de tristeza, cansaço e saudade.',sabia:'A ciranda nasceu entre as comunidades de pescadores do litoral de Pernambuco. É dançada em roda, de mãos dadas, por quem quiser entrar.'},
 'trator-vermelho':{regiao:'Minas Gerais e Goiás',texto:'De madrugada, na estrada de terra, se ouve um chiado comprido: nhééé, nhééé. É o carro de boi. Mas quando ele aparece na curva, não tem boi nenhum puxando. Só a canga vazia, brilhando azul, e as rodas de madeira girando sozinhas. Ele leva a colheita de quem não tem como levar e nunca chega atrasado. Velho, barulhento e nunca falhou.',sabia:'O chiado do carro de boi vem do atrito do eixo de madeira. Os carreiros diziam que o carro "cantava", e cada um tinha seu canto.'},
 'sanfoneiro-do-forro':{regiao:'Sudeste e Brasil todo',texto:'De repente sobe um redemoinho no meio do arraial, a fogueira estala mais alto e o chapéu do sanfoneiro voa longe. Lá no meio, de gorro vermelho, uma perna só e um sorriso maroto, vai o Saci-Pererê. Desamarra a rede, esconde o dedal da costureira, troca o sal pelo açúcar. Tudo num piscar de olhos. Com ele por perto, tudo acontece mais rápido.',sabia:'Diz a tradição que, para pegar o Saci, é preciso jogar uma peneira no meio do redemoinho e prendê-lo numa garrafa.'}
});

