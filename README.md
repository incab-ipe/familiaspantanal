# PANTANAL — Uma Saga Antológica

Aplicação web estática para explorar as relações genealógicas de **Tapirus terrestris** a partir do arquivo `dados.docx`, como material de navegação do podcast **PANTANAL — UMA SAGA ANTOLÓGICA**. A identidade usa Roboto e a paleta visual fornecida para o projeto.

A rede contém **38 indivíduos únicos, 15 parcerias registradas, 24 descendentes e três níveis visuais de relacionamento**. Rita, Justine, Duda e Wie recebem destaque gráfico como matriarcas. A primeira faixa aproxima os casais centrais Rita–Benjamin, Justine–Felipe, Duda–Caio e Wie–Brutus. A segunda dispõe Donna–Namorado, Morena–Vivek e Ariel–Jamie como novos núcleos; Morena e Namorado não ocupam a faixa dos pares fundadores. Essas faixas organizam relações, não idade nem cronologia.

## O que a aplicação faz

Clique em um círculo na rede para apenas destacar visualmente os vínculos desse indivíduo com genitores, filhotes, parceiros, irmãos e meio-irmãos — nenhum modal é aberto. A busca também destaca a conexão sem abrir ficha. É possível arrastar o mapa, usar o zoom, enquadrar a rede e ativar as linhas de irmãos e meio-irmãos. “Personagens” reúne as fichas com fotos e características — é somente nessa aba que a ficha completa é aberta. “A novela” apresenta os quatro capítulos fornecidos para o podcast.

Irmãos compartilham os dois genitores documentados. Meio-irmãos compartilham exatamente um. O documento não identifica sexo; esta versão registra Rita, Justine, Duda e Wie como fêmeas conforme informação complementar fornecida pelo usuário. Quando uma delas aparece entre os genitores, a ficha mostra a mãe conhecida; o pai e os sexos restantes permanecem **não informados**, sem inferência pelos nomes. Falta de parentesco registrado não prova ausência de parentesco biológico.

“Valentina + Doinho = Tete Joaninha” foi transcrito como um único descendente denominado **Tete Joaninha**, pois não há vírgula na fonte. Confirme se a intenção era esse nome ou dois indivíduos. Valentina e Doinho compartilham Benjamin como genitor e o cruzamento foi mantido sem alteração. “Donna + Namorado” permanece uma parceria sem descendentes informados; “Namorado” é apenas a identificação disponível. Nenhuma idade, foto ou característica individual foi inventada. A interpretação como novela não comprova comportamento, cronologia, exclusividade nem poligamia observada.

## Publicar no GitHub Pages — sem build

1. Crie um repositório no GitHub e envie os arquivos deste projeto extraídos do ZIP. O arquivo `index.html` deve ficar na raiz do repositório, ao lado de `site/` e `README.md`, não dentro de uma pasta adicional.
2. Abra **Settings → Pages**. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha a branch **main** e a pasta **/(root)**, e clique em **Save**.
4. Quando o GitHub concluir a publicação, o endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`. A página de entrada encaminha automaticamente para `site/`.

Não são necessários React, servidor, banco de dados, chaves API ou GitHub Actions. HTML, CSS, JavaScript moderno e SVG são servidos como arquivos estáticos. Os caminhos são relativos, então a aplicação funciona em subpastas de repositórios GitHub Pages. Para uma hospedagem estática alternativa, sirva diretamente o conteúdo de `site/`.

A disponibilidade do GitHub Pages para repositórios privados depende do seu plano no GitHub. Se publicar dados em um repositório público, todos os arquivos enviados ficam públicos. Não inclua observações confidenciais nem fotografias sem autorização.

## Rodar localmente

Instale Python 3, extraia o projeto e execute no diretório principal:

```bash
python3 -m http.server 3000 --directory site
```

Abra `http://localhost:3000`. Não abra `site/index.html` por `file://`: navegadores restringem módulos JavaScript fora de um servidor HTTP. Como alternativa, `npm run dev` executa o mesmo servidor, sem instalar dependências Node.

## Alterar genealogia, fotos e características

Os dados de origem estão em `site/js/data.js`. Cada registro de `unionDefinitions` mantém os nomes dos genitores, a lista de descendentes e a transcrição original. Novos indivíduos também precisam aparecer em `individualDefinitions`, com um nível genealógico coerente. Os nomes são convertidos em IDs únicos automaticamente. Nunca reutilize um nome para dois animais distintos sem ampliar o esquema de identificação.

Para versionar fotos reais, coloque as imagens em `site/assets/individuos/` e atribua ao campo `photo` do indivíduo o caminho `./assets/individuos/ID.jpg`. Para cadastrar características permanentemente, defina a lista `characteristics` do indivíduo em `site/js/data.js`. Esses caminhos são relativos à página, não ao arquivo JavaScript. Você também pode usar uma URL HTTPS autorizada. Não use a foto ilustrativa da espécie como se fosse de um indivíduo cadastrado.

As fichas exibem a foto disponível e os vínculos registrados, sem campos de cadastro ou edição local. Em “Sobre”, use “Baixar dados da rede” para obter um JSON contendo o conjunto de dados.

Para ter fotos e características permanentes, faça a alteração no arquivo antes de publicar. A maternidade de Rita, Justine, Duda e Wie é exibida nas relações correspondentes; os demais papéis parentais dependem de informação adicional confirmada.

## Estrutura

- `index.html`: entrada de publicação GitHub Pages na raiz.
- `site/index.html`: interface principal e diálogos acessíveis.
- `site/css/style.css`: tema editorial e layout responsivo.
- `site/js/data.js`: fonte estruturada, cálculo de parentescos e narrativas.
- `site/js/graph.js`: grafo SVG, layout, zoom, deslocamento e destaque.
- `site/js/main.js`: navegação, busca, fichas, armazenamento local e exportação.
- `site/js/profile.js`: validação de fotos HTTPS e caminhos relativos.
- `site/assets/`: imagens e favicon locais versionáveis.
- `tests/data.test.mjs`: testes de integridade e derivação dos parentescos.
- `tests/profile.test.mjs`: testes para URLs e caminhos seguros de fotos.
- `scripts/build.mjs`: cópia opcional de `site/` para `dist/`, sem dependências.

## Verificar os dados

Com Node.js 20.11 ou superior:

```bash
npm test
npm run build
```

Os testes verificam nomes e IDs únicos, contagens, genitores dos descendentes, os irmãos Doinho/Donna, os meio-irmãos Doinho/Valentina, os seis descendentes de Duda em cinco uniões e a parceria Donna/Namorado sem filhotes inventados.

## Créditos e direitos de uso

Os vínculos e nomes foram fornecidos em `dados.docx`. O arquivo original não é distribuído no projeto; o módulo preserva todas as linhas genealógicas usadas na rede.

A foto ilustrativa da espécie em “Sobre” é **“Lowland Tapir (Tapirus terrestris) leaving the glade …”**, de **Bernard DUPONT**, disponível no [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Lowland_Tapir_%28Tapirus_terrestris%29_leaving_the_glade_..._%2829261266301%29.jpg), sob [Creative Commons Attribution-ShareAlike 2.0](https://creativecommons.org/licenses/by-sa/2.0/). A cópia local é o thumbnail obtido no Commons; o enquadramento visual usa CSS. Preserve esses créditos e a licença ao redistribuir. A foto não identifica nenhum dos animais da rede.

O fundo de floresta é uma imagem ilustrativa gerada por IA para esta interface, sem animais reais. As fontes DM Sans e Cormorant Garamond são carregadas do Google Fonts com fallbacks locais do sistema. Caso o Google Fonts não esteja acessível, a aplicação continua funcionando com as fontes alternativas.

Este pacote está pronto para publicação, mas não cria automaticamente um repositório ou ativa o GitHub Pages na sua conta.
