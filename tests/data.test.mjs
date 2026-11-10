import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  individuals,
  unions,
  byId,
  getRelations,
  getNetworkIds,
  stories,
  stats,
} from '../site/js/data.js';

const sorted = (values) => [...values].sort();
const idsOf = (names) => names.map((name) => name.toLowerCase());


test('mantém IDs únicos e só usa os quatro sexos explicitamente informados', () => {
  assert.equal(new Set(individuals.map(({ id }) => id)).size, individuals.length);
  assert.equal(new Set(individuals.map(({ name }) => name)).size, individuals.length);

  const matriarchs = new Set(['rita', 'justine', 'duda', 'wie']);
  for (const individual of individuals) {
    assert.match(individual.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(individual.sex, matriarchs.has(individual.id) ? 'female' : 'unknown');
    assert.equal(individual.isMatriarch, matriarchs.has(individual.id));
    assert.equal(individual.photo, null);
    assert.deepEqual(individual.characteristics, []);
    assert.equal(byId.get(individual.id), individual);
  }

  assert.equal(byId.get('tete-joaninha').name, 'Tete Joaninha');
  assert.match(byId.get('tete-joaninha').note, /único indivíduo/i);
  assert.equal(byId.get('morena').generation, 1);
  assert.equal(byId.get('namorado').generation, 1);
});


test('registra as contagens e as três gerações documentadas', () => {
  assert.deepEqual(stats, {
    individuals: 38,
    unions: 15,
    offspring: 24,
    generations: 3,
  });
});


test('cada união tem dois genitores conhecidos e cada filhote preserva seus genitores', () => {
  const childOccurrences = [];

  for (const union of unions) {
    assert.equal(union.parents.length, 2);
    assert.equal(new Set(union.parents).size, 2);
    assert.ok(union.source.length > 0);
    for (const parentId of union.parents) assert.ok(byId.has(parentId));

    for (const childId of union.children) {
      assert.ok(byId.has(childId));
      childOccurrences.push(childId);
      assert.deepEqual(sorted(getRelations(childId).parents), sorted(union.parents));
    }
  }

  assert.equal(new Set(childOccurrences).size, childOccurrences.length);
  assert.equal(childOccurrences.length, stats.offspring);
});


test('Doinho e Donna são irmãos, e Valentina e Doinho são meio-irmãos', () => {
  const doinho = getRelations('doinho');
  const donna = getRelations('donna');

  assert.deepEqual(doinho.parents, ['benjamin', 'rita']);
  assert.deepEqual(doinho.father, null);
  assert.equal(doinho.mother, 'rita');
  assert.equal(getRelations('donna').mother, 'rita');
  assert.equal(getRelations('jamie').mother, 'justine');
  assert.equal(getRelations('ariel').mother, 'wie');
  assert.equal(getRelations('paula').mother, 'duda');
  assert.ok(doinho.siblings.includes('donna'));
  assert.ok(donna.siblings.includes('doinho'));

  assert.ok(
    doinho.halfSiblings.some(
      ({ id, sharedParent }) => id === 'valentina' && sharedParent === 'benjamin',
    ),
  );
  assert.ok(
    getRelations('valentina').halfSiblings.some(
      ({ id, sharedParent }) => id === 'doinho' && sharedParent === 'benjamin',
    ),
  );
});


test('preserva Jamie e Ariel como parceiros e seus três filhos', () => {
  const jamie = getRelations('jamie');
  const ariel = getRelations('ariel');

  assert.deepEqual(jamie.parents, ['justine', 'felipe']);
  assert.deepEqual(jamie.partners, ['ariel']);
  assert.deepEqual(sorted(jamie.children), sorted(['romeu', 'sereia', 'sebastiao']));
  assert.deepEqual(ariel.parents, ['wie', 'brutus']);
  assert.deepEqual(ariel.partners, ['jamie']);
  assert.deepEqual(sorted(ariel.children), sorted(['romeu', 'sereia', 'sebastiao']));
});


test('deriva corretamente os seis filhos de Duda em cinco uniões', () => {
  const duda = getRelations('duda');
  assert.deepEqual(
    sorted(duda.children),
    sorted(['paula', 'valentina', 'panqueca', 'mucci', 'michele', 'joao-guilherme']),
  );

  const dudaUnions = unions.filter(({ parents }) => parents.includes('duda'));
  assert.equal(dudaUnions.length, 5);
  assert.equal(new Set(dudaUnions.flatMap(({ children }) => children)).size, 6);
});


test('Donna e Namorado não recebem descendentes sem registro de filhos', () => {
  assert.deepEqual(getRelations('donna').children, []);
  assert.deepEqual(getRelations('donna').partners, ['namorado']);
  assert.deepEqual(getRelations('namorado').children, []);
  assert.deepEqual(getRelations('namorado').partners, ['donna']);
});


test('a rede contém genitores, foco, parceiros, filhotes, irmãos e meio-irmãos', () => {
  const network = getNetworkIds('doinho');
  for (const id of ['benjamin', 'rita', 'doinho', 'valentina', 'tete-joaninha', 'donna']) {
    assert.ok(network.has(id), `rede deveria conter ${id}`);
  }
});


test('stories têm o contrato mínimo e os IDs de foco existem', () => {
  assert.ok(stories.length >= 4 && stories.length <= 6);
  for (const story of stories) {
    assert.ok(story.id);
    assert.ok(story.title);
    assert.ok(story.kicker);
    assert.ok(story.body);
    assert.ok(byId.has(story.focusId));
  }
});


test('ordenação visual preserva Bandaid antes de Rita e a ordem anterior dos descendentes', () => {
  const graph = readFileSync(new URL('../site/js/graph.js', import.meta.url), 'utf8');
  assert.ok(graph.includes("const founderOrder = ['bandaid', 'rita', 'benjamin'"));
  assert.ok(graph.includes("const secondGenerationOrder = ['doinho', 'donna', 'namorado', 'nic', 'morena', 'vivek', 'jamie', 'ariel', 'manchinha', 'rupert', 'ted', 'columbus', 'little-bro'"));
});
