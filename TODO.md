# TODO — Entre Laços: Tapirus terrestris

## Rede genealógica e relações parentais
- [x] Usar os dados do arquivo `dados.docx` para exibir cada anta como um indivíduo/nó próprio e representar as relações reprodutivas registradas. Implementado em `site/js/data.js`: 38 indivíduos, 15 parcerias, 24 descendentes, sem duplicação.
- [x] Discriminar pai, mãe, filhotes, irmãos e meio-irmãos na rede. Rita, Justine, Duda e Wie são fêmeas, conforme informação adicional do usuário; mostrar essas mães onde os registros as listam como genitores. Não inferir sexo dos demais indivíduos nem atribuir os papéis de pai sem informação; marcar papéis desconhecidos como “não informado”. Campos explícitos nas fichas e nota na legenda.
- [x] Distinguir irmãos que compartilham os dois genitores registrados de meio-irmãos que compartilham apenas um genitor, sem afirmar vínculos que não estejam sustentados pelos dados. Derivação testada; filtros de linhas e listas nas fichas.
- [x] Representar como relação sem filhotes informados o par Donna + Namorado, sem inventar identidade ou descendentes. Caso validado nos testes.

## Fichas individuais e exploração
- [x] Permitir abrir a ficha de cada personagem com a foto disponível e seus vínculos conhecidos, sem campos de cadastro ou edição de características.
- [x] Destacar o indivíduo selecionado e suas conexões familiares diretas; permitir navegar a rede com zoom, deslocamento e foco em indivíduos e núcleos familiares. Implementado em `site/js/graph.js` e `site/js/main.js`.
- [x] Incluir uma legenda que explique os tipos de parentesco, conexões e estados dos indivíduos. Legenda de quatro vínculos, notas sobre origem e fotos e sobre pai/mãe desconhecidos.
- [x] Destacar visualmente Rita, Justine, Duda e Wie como matriarcas principais sem alterar seus vínculos com os demais indivíduos.
- [x] Organizar Donna + Namorado, Morena + Vivek e Ariel + Jamie como novos núcleos da segunda geração. Morena e Namorado não aparecem na faixa dos casais da primeira geração com Rita, Benjamin, Justine, Felipe, Duda, Caio, Wie e Brutus.

## Narrativa e publicação
- [x] Contar a novela das interações poligâmicas entre os indivíduos a partir dos vínculos registrados, diferenciando fato informado de informação desconhecida e sem inventar sexo, romance, datas ou descendentes. Cinco encontros e modal Sobre com limitações explícitas.
- [x] Entregar um layout responsivo para computadores, tablets e celulares. CSS com breakpoints e fichas adaptáveis; correção confirmada do ícone Sobre em mobile.
- [x] Implementar a aplicação como front-end estático, com dados e imagens em arquivos versionáveis, compatível com publicação no GitHub Pages. HTML/CSS/JavaScript/SVG, imagens locais, entrada raiz e `.nojekyll`, README com publicação main/root. Publicação na conta GitHub não foi realizada, pois não foi indicado nem conectado um repositório.

## Evidência de integração

Sintaxe JavaScript validada, dados cobertos por testes `node:test`, build estático concluído e servidor HTTP saudável na porta configurada. Conferência independente somente leitura verificou vínculos, navegação, paths, modais e eventos; os dois achados pontuais (ícone Sobre mobile e validação de foto HTTP) foram corrigidos. Captura única de diagnóstico verificou os ajustes de posicionamento do grafo e legenda.
- [x] Atualizar a aba A novela com os quatro relatos fornecidos: Rita e Benjamin, Justine e Felipe, Duda e Caio, Wie e Brutus.
- [x] Substituir a marca por PANTANAL — UMA SAGA ANTOLÓGICA, usar Roboto e incorporar a identidade visual anexada em Sobre.
- [x] Fazer o clique na rede abrir somente vínculos; deixar as fichas com fotos disponíveis apenas nos cards da aba Personagens.
- [x] Usar PEDIDOWHATS.jpg como logo ao lado do nome Pantanal e como imagem da aba Sobre.
- [x] Aplicar Roboto ao título da árvore e aos nomes dos indivíduos.
- [x] Posicionar Bandaid à esquerda de Rita, manter a ordem anterior dos descendentes e corrigir o nome para Little Bro.
- [x] Criar uma versão mobile além da versão desktop, com cabeçalho em duas linhas, navegação horizontal de núcleos, grafo legível com rolagem, cards em coluna e modais adaptados.
