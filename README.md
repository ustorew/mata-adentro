# Mata Adentro

Duelo de lendas do Brasil: jogo de cartas com contas, jogo salvo na nuvem, Feira entre jogadores e duelos ao vivo.
O Vintém é **moeda simulada**: não tem dinheiro real nem blockchain.

## O que tem aqui

- **Contas**: cada pessoa entra com e-mail, senha e um apelido.
- **Jogo salvo na nuvem**: o progresso sobe sozinho a cada poucos segundos. Dá para continuar em outro aparelho. Se faltar internet, o jogo guarda no aparelho e sobe quando a conexão voltar.
- **Feira dos jogadores**: quem tem carta repetida anuncia pelo preço que quiser (dentro de uma faixa por raridade). Outra pessoa compra. 10% de cada venda é queimado (some do jogo) para segurar a inflação. O anúncio dura 3 dias; se ninguém comprar, a carta volta. A Feira dos feirantes (robôs) continua existindo ao lado.
- **Duelo ao vivo**: "Procurar rival" junta duas pessoas que estão procurando ao mesmo tempo. "Jogar com amigo" cria uma sala com um número de 4 algarismos. Cada turno tem 75 segundos. Quem cai tem 1 minuto e meio para voltar. Vitória vale +25 de Glória e 15 Vinténs (até 5 vitórias pagas por dia); derrota tira 15 de Glória. Duelo com amigo não mexe na Glória. Há um ranking.
- As regras do duelo rodam **no servidor**, com o mesmo motor do jogo. O navegador só manda a jogada e mostra as animações.

## Como colocar no ar (passo a passo)

Custo inicial: zero. São dois serviços grátis: o **Neon** guarda o banco de dados e o **Render** roda o servidor.

1. **Banco de dados (Neon)**
   1. Entre em <https://neon.tech> e crie uma conta (dá para entrar com a conta do GitHub).
   2. Crie um projeto chamado `mata-adentro` (região: São Paulo, se aparecer).
   3. Na tela do projeto, copie a **connection string** (começa com `postgresql://`). Guarde, ela é a senha do banco.
2. **Servidor (Render)**
   1. Entre em <https://render.com> e crie uma conta com o GitHub.
   2. Clique em **New → Blueprint** e escolha o repositório `mata-adentro`. O Render lê o arquivo `render.yaml` sozinho.
   3. Quando ele pedir `DATABASE_URL`, cole a connection string do Neon.
   4. Clique em **Apply**. Em uns 3 minutos aparece um endereço do tipo `https://mata-adentro.onrender.com`. Esse é o link do jogo.
3. Abra o link, crie sua conta e mande o link para quem vai testar.

Observação do plano grátis do Render: depois de 15 minutos sem ninguém jogando, o servidor dorme e a primeira pessoa espera uns 30 a 50 segundos para ele acordar. Para o teste com amigos isso basta; para lançar, o plano pago mais barato (cerca de US$ 7 por mês) mantém o servidor sempre acordado.

## Para quem programa

```
npm install
DATABASE_URL=postgres://usuario:senha@localhost:5432/mata npm start   # http://localhost:3000
npm test                                                                # precisa de um PostgreSQL de teste (TEST_DATABASE_URL)
```

- `client/` é o jogo. `client/game/*.js` são os módulos na ordem de `client/game/ORDEM.txt`; `client/vendor/` são os modelos 3D, as artes e o Three.js; `client/index.template.html` é a casca com o CSS. `npm run build` monta tudo em `public/index.html`, uma página só, como no protótipo.
- `client/game/85-online.js` é a parte online do navegador: tela de conta, envio do save, Feira dos jogadores e o duelo ao vivo.
- `server/` é o servidor (Node.js, Express, WebSocket, PostgreSQL):
  - `auth.js` contas e sessões (senha com scrypt, token guardado só como hash);
  - `saves.js` jogo salvo com número de revisão (um aparelho não apaga o progresso de outro);
  - `feira.js` Feira entre jogadores;
  - `pvp.js` fila, salas, turnos e resultado dos duelos;
  - `motor.js` carrega as regras do jogo (`client/game/10-data … 50-engine`) dentro do servidor;
  - `db.js` cria as tabelas sozinho quando o servidor liga.
- `tools/split.js` foi usado uma vez para separar o HTML do protótipo em arquivos.

### Limites conhecidos (fase de teste)

- O progresso fora da Feira e dos duelos (pacotes, baús, missões) ainda é calculado no navegador. Uma pessoa que mexa no código da página consegue se dar Vinténs. Para testar com amigos tudo bem; antes de qualquer dinheiro real, essas contas precisam ir para o servidor.
- Ainda não existe "esqueci a senha" por e-mail.
- O Diário do duelo usa os apelidos, mas algumas frases ainda falam do ponto de vista de quem começou ("herói rival").
