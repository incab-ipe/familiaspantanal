const slugify = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const individualDefinitions = [
  ['Benjamin', 0],
  ['Rita', 0],
  ['Bandaid', 0],
  ['Morena', 1],
  ['Justine', 0],
  ['Felipe', 0],
  ['Duda', 0],
  ['Caio', 0],
  ['Sergião', 0],
  ['Sachin', 0],
  ['Nelsão', 0],
  ['Wie', 0],
  ['Brutus', 0],
  ['Namorado', 1],
  ['Doinho', 1],
  ['Donna', 1],
  ['Nic', 1],
  ['Vivek', 1],
  ['Cuzinho', 2],
  ['Morenino', 2],
  ['Jamie', 1],
  ['Manchinha', 1],
  ['Rupert', 1],
  ['Ted', 1],
  ['Columbus', 1],
  ['Little Bro', 1],
  ['Romeu', 2],
  ['Sereia', 2],
  ['Sebastião', 2],
  ['Paula', 1],
  ['Valentina', 1],
  ['Panqueca', 1],
  ['Mucci', 1],
  ['Michele', 1],
  ['João Guilherme', 1],
  ['Ariel', 1],
  ['Bastardo', 1],
  ['Tete Joaninha', 2],
].map(([name, generation]) => ({ name, generation }));

const matriarchIds = new Set(['rita', 'justine', 'duda', 'wie']);

const tete = individualDefinitions.find(({ name }) => name === 'Tete Joaninha');
tete.note =
  'Possível ambiguidade: “Tete Joaninha” foi preservado como um único indivíduo, pois não há vírgula no registro.';

export const individuals = individualDefinitions.map(({ name, generation, note }) => ({
  id: slugify(name),
  name,
  generation,
  sex: matriarchIds.has(slugify(name)) ? 'female' : 'unknown',
  isMatriarch: matriarchIds.has(slugify(name)),
  photo: null,
  characteristics: [],
  ...(note ? { note } : {}),
}));

const unionDefinitions = [
  {
    parents: ['Benjamin', 'Rita'],
    children: ['Doinho', 'Donna'],
    source: 'Benjamin + Rita = Doinho, Donna',
  },
  {
    parents: ['Rita', 'Bandaid'],
    children: ['Nic', 'Vivek'],
    source: 'Rita e Bandaid = Nic, Vivek',
  },
  {
    parents: ['Vivek', 'Morena'],
    children: ['Cuzinho', 'Morenino'],
    source: 'Vivek + Morena = Cuzinho, Morenino',
  },
  {
    parents: ['Justine', 'Felipe'],
    children: ['Jamie', 'Manchinha', 'Rupert', 'Ted'],
    source: 'Justine + Felipe = Jamie, Manchinha, Rupert, Ted',
  },
  {
    parents: ['Justine', 'Benjamin'],
    children: ['Columbus', 'Little Bro'],
    source: 'Justine + Benjamin = Columbus, Little Bro',
  },
  {
    parents: ['Jamie', 'Ariel'],
    children: ['Romeu', 'Sereia', 'Sebastião'],
    source: 'Jamie + Ariel = Romeu, Sereia, Sebastião',
  },
  {
    parents: ['Duda', 'Caio'],
    children: ['Paula'],
    source: 'Duda + Caio = Paula',
  },
  {
    parents: ['Duda', 'Benjamin'],
    children: ['Valentina', 'Panqueca'],
    source: 'Duda + Benjamin = Valentina, Panqueca',
  },
  {
    parents: ['Duda', 'Sergião'],
    children: ['Mucci'],
    source: 'Duda + Sergião = Mucci',
  },
  {
    parents: ['Duda', 'Sachin'],
    children: ['Michele'],
    source: 'Duda + Sachin = Michele',
  },
  {
    parents: ['Duda', 'Nelsão'],
    children: ['João Guilherme'],
    source: 'Duda + Nelsão = João Guilherme',
  },
  {
    parents: ['Wie', 'Brutus'],
    children: ['Ariel'],
    source: 'Wie + Brutus = Ariel',
  },
  {
    parents: ['Wie', 'Benjamin'],
    children: ['Bastardo'],
    source: 'Wie + Benjamin = Bastardo',
  },
  {
    parents: ['Valentina', 'Doinho'],
    children: ['Tete Joaninha'],
    source: 'VALENTINA + DOINHO = TETE JOANINHA',
  },
  {
    parents: ['Donna', 'Namorado'],
    children: [],
    source: 'DONNA + NAMORADO',
  },
];

export const unions = unionDefinitions.map(({ parents, children, source }) => ({
  id: `union-${parents.map(slugify).join('-')}`,
  parents: parents.map(slugify),
  children: children.map(slugify),
  source,
}));

export const byId = new Map(individuals.map((individual) => [individual.id, individual]));

const parentByChild = new Map(individuals.map(({ id }) => [id, []]));
const childrenByParent = new Map(individuals.map(({ id }) => [id, []]));
const partnersByPerson = new Map(individuals.map(({ id }) => [id, []]));

const addUnique = (array, value) => {
  if (!array.includes(value)) array.push(value);
};

for (const union of unions) {
  const [firstParent, secondParent] = union.parents;
  addUnique(partnersByPerson.get(firstParent), secondParent);
  addUnique(partnersByPerson.get(secondParent), firstParent);

  for (const childId of union.children) {
    for (const parentId of union.parents) {
      addUnique(parentByChild.get(childId), parentId);
      addUnique(childrenByParent.get(parentId), childId);
    }
  }
}

const assertKnown = (id) => {
  if (!byId.has(id)) throw new RangeError(`Indivíduo desconhecido: ${id}`);
};

export function getRelations(id) {
  assertKnown(id);

  const parents = [...parentByChild.get(id)];
  const children = [...childrenByParent.get(id)];
  const partners = [...partnersByPerson.get(id)];
  const sharedParents = new Map();

  for (const parentId of parents) {
    for (const siblingId of childrenByParent.get(parentId)) {
      if (siblingId === id) continue;
      if (!sharedParents.has(siblingId)) sharedParents.set(siblingId, []);
      addUnique(sharedParents.get(siblingId), parentId);
    }
  }

  const siblings = [];
  const halfSiblings = [];
  for (const [siblingId, sharedParentIds] of sharedParents) {
    if (sharedParentIds.length >= 2) {
      siblings.push(siblingId);
    } else {
      halfSiblings.push({ id: siblingId, sharedParent: sharedParentIds[0] });
    }
  }

  const mother = parents.find((parentId) => byId.get(parentId).sex === 'female') ?? null;
  const father = parents.find((parentId) => byId.get(parentId).sex === 'male') ?? null;

  return {
    parents,
    father,
    mother,
    children,
    partners,
    siblings,
    halfSiblings,
  };
}

export function getNetworkIds(focusId) {
  const relations = getRelations(focusId);
  return new Set([
    ...relations.parents,
    focusId,
    ...relations.partners,
    ...relations.children,
    ...relations.siblings,
    ...relations.halfSiblings.map(({ id }) => id),
  ]);
}

export const stories = [
  {
    id: 'rita-benjamin',
    title: 'Rita e Benjamin',
    kicker: 'CAPÍTULO 01 · UM NOVO AMOR',
    body: 'Rita era uma anta grande e muito linda — com seus dois metros e 15 centímetros de comprimento, mais de um metro de altura e pesando quase 250 quilos. Benjamin conquistou o coração de Rita, que havia perdido seu primeiro amor: Bandaid. Nessa altura, Rita estava com seus filhos, Nic e Vivek, já adultos, e aceitou o novo amor em meio à solidão. O amor de Rita e Benjamin era turbulento, cheio de reviravoltas que você pode ouvir no podcast Pantanal – Uma Saga Antológica.',
    focusId: 'rita',
  },
  {
    id: 'justine-felipe',
    title: 'Justine e Felipe',
    kicker: 'CAPÍTULO 02 · OPOSTOS',
    body: 'Justine se mudou para a Baía das Pedras aos dois anos e logo chamou a atenção de Felipe, um macho muito estressado. Eles são o típico casal de opostos que se atraem, mas o que parecia uma história linda de amor se transformou em traições. O destino deles você confere no podcast Pantanal – Uma Saga Antológica.',
    focusId: 'justine',
  },
  {
    id: 'duda-caio',
    title: 'Duda e Caio',
    kicker: 'CAPÍTULO 03 · UMA VIDA DUPLA',
    body: 'Caio havia acabado de se mudar para a fazenda Baía das Pedras quando conheceu Duda. A belíssima anta tinha perdido seu parceiro há pouco tempo e criava uma filha adolescente. Caio, com seu jeito calmo e compreensivo, conquistou seu coração. O casal parecia se dar muito bem, mas longe dos olhos de seu parceiro, Duda vivia uma vida dupla.',
    focusId: 'duda',
  },
  {
    id: 'wie-brutus',
    title: 'Wie e Brutus',
    kicker: 'CAPÍTULO 04 · UMA TEMPORADA',
    body: 'Wie é uma anta muito conhecida por seus olhos de mel. Essa bela anta chegou na fazenda Baía das Pedras e abalou relações. Muitos machos passaram a persegui-la, mas ela acabou se apaixonando por um macho de passagem chamado Brutus. Juntos, eles tiveram uma pequena melancia, mas o amor durou apenas uma temporada, pois logo ele foi embora. Desde então, Wie busca pelo amor que esperou encontrar em Brutus.',
    focusId: 'wie',
  },
];

export const stats = {
  individuals: individuals.length,
  unions: unions.length,
  offspring: new Set(unions.flatMap(({ children }) => children)).size,
  generations: new Set(individuals.map(({ generation }) => generation)).size,
};
