import { individuals, unions, byId, getRelations, getNetworkIds, stories, stats } from './data.js';
import { GenealogyGraph, initials } from './graph.js';
import { validatePhotoSource } from './profile.js';

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const storageKey = 'entre-lacos-profiles-v1';
let profiles = {};
try { profiles = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { profiles = {}; }
if (!profiles || typeof profiles !== 'object' || Array.isArray(profiles)) profiles = {};
const requestedFocus = new URLSearchParams(window.location.search).get('nucleo');
let activeFocus = requestedFocus === 'todos' ? null : byId.has(requestedFocus) ? requestedFocus : 'benjamin';
let activeTab = 'network';
let selectedId = null;
let modalPersonId = null;
let previousFocus = null;
let toastTimer;
const filters = new Set(['parent']);
const familyGroups = [
  {
    title: 'MATRIZES · 1ª GERAÇÃO',
    kind: 'matriarch',
    families: [
      { id: 'benjamin', name: 'Rita + Benjamin' },
      { id: 'justine', name: 'Justine + Felipe' },
      { id: 'duda', name: 'Duda + Caio' },
      { id: 'wie', name: 'Wie + Brutus' },
    ],
  },
  {
    title: 'NOVOS NÚCLEOS · 2ª GERAÇÃO',
    kind: 'second-generation',
    families: [
      { id: 'donna', name: 'Donna + Namorado' },
      { id: 'morena', name: 'Morena + Vivek' },
      { id: 'ariel', name: 'Ariel + Jamie' },
    ],
  },
];

const graph = new GenealogyGraph($('#graph'), {
  onSelect: (id) => highlightNetworkPerson(id),
  onZoom: (value) => { $('#zoom-value').textContent = `${value}%`; },
});

function photoFor(person) {
  return profiles[person.id]?.photo || person.photo || null;
}
function names(ids) { return ids.map((id) => byId.get(id).name).join(', '); }
function listTags(ids, empty = 'Não informado no arquivo') {
  return ids.length ? ids.map((id) => `<button class="person-link" data-person="${id}">${escapeHTML(byId.get(id).name)}</button>`).join('') : `<span class="relation-empty">${empty}</span>`;
}
function relationBlock(title, content) {
  return `<div class="relation-block"><h3>${title}</h3><div class="relation-tags">${content}</div></div>`;
}
function currentIds() {
  if (!activeFocus) return new Set(individuals.map((person) => person.id));
  const ids = getNetworkIds(activeFocus);
  if (activeFocus === 'benjamin') ids.add('bandaid');
  return ids;
}
function renderNetwork() {
  const ids = currentIds();
  const photos = Object.fromEntries(individuals.map((person) => [person.id, photoFor(person)]));
  graph.render(ids, selectedId, filters, photos);
  $('#graph-status').textContent = `${activeFocus ? `Núcleo ${byId.get(activeFocus).name}` : 'Toda a rede'} · ${ids.size} indivíduos`;
  renderFamilies();
}
function renderFamilies() {
  const allButton = `<button class="family-button all-network ${activeFocus === null ? 'active' : ''}" data-family="all" aria-pressed="${activeFocus === null}"><span class="family-dot"></span><span>Toda a rede</span><span class="family-count">${stats.individuals}</span></button>`;
  const groupedButtons = familyGroups.map((group) => `<section class="family-group"><h3 class="family-group-title">${group.title}</h3>${group.families.map(({ id, name }) => { const count = id === 'benjamin' ? getNetworkIds(id).size + 1 : getNetworkIds(id).size; return `<button class="family-button ${group.kind} ${activeFocus === id ? 'active' : ''}" data-family="${id}" aria-pressed="${activeFocus === id}"><span class="family-dot"></span><span>${name}</span><span class="family-count">${count}</span></button>`; }).join('')}</section>`).join('');
  $('#family-nav').innerHTML = allButton + groupedButtons;
  const isListed = familyGroups.some((group) => group.families.some((family) => family.id === activeFocus));
  if (activeFocus && !isListed) {
    $('#family-nav').insertAdjacentHTML('beforeend', `<section class="family-group focused-group"><h3 class="family-group-title">EM FOCO</h3><button class="family-button active" data-family="${activeFocus}" aria-pressed="true"><span class="family-dot"></span><span>${escapeHTML(byId.get(activeFocus).name)}</span><span class="family-count">${getNetworkIds(activeFocus).size}</span></button></section>`);
  }
}
function setFocus(id) {
  activeFocus = id;
  selectedId = id;
  setTab('network');
  renderNetwork();
}
function highlightNetworkPerson(id) {
  if (!byId.has(id)) return;
  selectedId = id;
  graph.highlight(id);
  $('#graph-status').textContent = `${activeFocus ? `Núcleo ${byId.get(activeFocus).name}` : 'Toda a rede'} · conexão destacada: ${byId.get(id).name}`;
}
function setTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  ['network', 'characters', 'story'].forEach((name) => { $(`#${name}-view`).hidden = name !== tab; });
  const titles = {
    network: ['A GENEALOGIA', 'Uma família nada convencional.', 'Clique em um círculo para ver somente os vínculos registrados.'],
    characters: ['O ELENCO', 'Cada nome, uma história.', 'Clique em um personagem para abrir sua ficha e foto.'],
    story: ['A NOVELA', 'Pantanal — uma saga antológica.', 'Quatro histórias de amor, encontros e reviravoltas.'],
  };
  const [kicker, title, description] = titles[tab];
  $('#view-kicker').textContent = kicker;
  $('#view-title').textContent = title;
  $('#view-description').textContent = description;
  if (tab === 'network') requestAnimationFrame(() => graph.fit());
}

function avatar(person) {
  const photo = photoFor(person);
  return `<span class="avatar-initial">${escapeHTML(initials(person.name))}${photo ? `<img src="${escapeHTML(photo)}" alt="${escapeHTML(person.name)}">` : ''}</span>`;
}
function renderCharacters(query = '') {
  const found = individuals.filter((person) => normalize(person.name).includes(normalize(query))).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  $('#character-count').textContent = `${found.length} ${found.length === 1 ? 'personagem' : 'personagens'}`;
  $('#characters-grid').innerHTML = found.length ? found.map((person) => {
    const relation = getRelations(person.id);
    return `<article class="character-card"><button data-character-person="${person.id}">${avatar(person)}<span class="character-copy"><strong class="character-name">${escapeHTML(person.name)}</strong><span class="character-meta">${relation.children.length ? `${relation.children.length} filhotes registrados` : relation.parents.length ? `Descendente · geração ${person.generation + 1}` : 'Genitores não informados'}</span></span></button></article>`;
  }).join('') : '<div class="empty-state"><div><h2>Nenhum personagem encontrado.</h2><p>Tente outro nome ou apague a busca.</p></div></div>';
  $('#characters-grid').querySelectorAll('img').forEach((image) => image.addEventListener('error', () => image.remove()));
}
function renderStories() {
  $('#stories').innerHTML = stories.map((story, index) => `<article class="story-card ${story.id === 'tete-joaninha' ? 'highlight' : ''}"><span class="story-number">${String(index + 1).padStart(2, '0')} / ENCONTRO</span><div class="eyebrow">${escapeHTML(story.kicker)}</div><h2>${escapeHTML(story.title)}</h2><p>${escapeHTML(story.body)}</p><button class="text-button" data-story-focus="${story.focusId}">Explorar este encontro</button></article>`).join('');
}

function personSummary(person, relation) {
  if (relation.children.length) return `${person.name} conecta ${relation.partners.length} ${relation.partners.length === 1 ? 'parceria registrada' : 'parcerias registradas'} e ${relation.children.length} ${relation.children.length === 1 ? 'descendente' : 'descendentes'} nesta rede.`;
  if (relation.parents.length) return `${person.name} descende de ${names(relation.parents)}. ${relation.siblings.length ? `Compartilha os dois genitores com ${names(relation.siblings)}.` : 'Não há irmãos com os mesmos dois genitores registrados.'}`;
  return `${person.name} aparece em uma parceria registrada. Seus genitores não estão informados no arquivo.`;
}
function renderPerson(id, showProfile = false) {
  const person = byId.get(id);
  const relation = getRelations(id);
  const photo = photoFor(person);
  const halfTags = relation.halfSiblings.length ? relation.halfSiblings.map((half) => `<div class="half-relation"><button class="person-link" data-person="${half.id}">${escapeHTML(byId.get(half.id).name)}</button><small>via ${escapeHTML(byId.get(half.sharedParent).name)}</small></div>`).join('') : '<span class="relation-empty">Não registrados</span>';
  const parentRoleContent = `<span class="parent-role-line">Pai: ${relation.father ? `<button class="person-link" data-person="${relation.father}">${escapeHTML(byId.get(relation.father).name)}</button>` : 'não informado'}</span><span class="parent-role-line">Mãe: ${relation.mother ? `<button class="person-link" data-person="${relation.mother}">${escapeHTML(byId.get(relation.mother).name)}</button>` : 'não informada'}</span>`;
  $('#person-content').innerHTML = `<div class="portrait-panel relation-portrait"><span class="portrait-initial">${escapeHTML(initials(person.name))}</span>${showProfile && photo ? `<img id="portrait-image" src="${escapeHTML(photo)}" alt="Foto de ${escapeHTML(person.name)}">` : ''}<span class="photo-status">${showProfile ? (photo ? 'FOTO DO INDIVÍDUO' : 'FOTO NÃO DISPONÍVEL') : 'VÍNCULOS REGISTRADOS'}</span><span class="portrait-species">Tapirus terrestris · ${escapeHTML(person.id)}</span></div><div class="person-body"><div class="modal-eyebrow">${showProfile ? 'FICHA DO INDIVÍDUO' : 'VÍNCULOS DO INDIVÍDUO'} · GERAÇÃO ${person.generation + 1}</div><h2 class="person-title" id="person-name">${escapeHTML(person.name)}</h2><div class="person-badges"><span class="badge">${person.isMatriarch ? 'Fêmea · matriarca' : 'Sexo não informado'}</span>${relation.partners.length > 1 ? `<span class="badge accent">${relation.partners.length} parcerias</span>` : ''}${relation.children.length ? `<span class="badge">${relation.children.length} filhotes</span>` : ''}</div><p class="person-story">${escapeHTML(personSummary(person, relation))}</p><div class="relation-grid">${relationBlock('Genitores registrados', listTags(relation.parents))}${relationBlock('Pai / mãe', parentRoleContent)}${relationBlock(`Filhotes · ${relation.children.length}`, listTags(relation.children, 'Não registrados'))}${relationBlock(`Parcerias · ${relation.partners.length}`, listTags(relation.partners, 'Não registradas'))}${relationBlock(`Irmãos · ${relation.siblings.length}`, listTags(relation.siblings, 'Não registrados'))}${relationBlock(`Meio-irmãos · ${relation.halfSiblings.length}`, halfTags)}</div>${showProfile && person.note ? `<p class="metadata-note">${escapeHTML(person.note)}</p>` : ''}<footer class="modal-footer"><button class="text-button" id="focus-person">Ver este núcleo na rede</button></footer></div>`;
  $('#portrait-image')?.addEventListener('error', (event) => {
    event.currentTarget.remove();
    $('#person-content .photo-status').textContent = 'IMAGEM INDISPONÍVEL';
  });
  $('#focus-person')?.addEventListener('click', () => { closeModal(); setFocus(id); });
}
function openPerson(id, showProfile = false) {
  if (!byId.has(id)) return;
  modalPersonId = id;
  selectedId = id;
  graph.highlight(id);
  renderPerson(id, showProfile);
  openModal($('#person-dialog'));
}
function openModal(backdrop) {
  if (!document.body.classList.contains('modal-open')) previousFocus = document.activeElement;
  document.querySelectorAll('.modal-backdrop').forEach((modal) => { modal.hidden = modal !== backdrop; modal.classList.remove('is-open'); });
  backdrop.hidden = false;
  backdrop.classList.add('is-open');
  document.body.classList.add('modal-open');
  document.querySelector('.workspace').inert = true;
  $('.app-header').inert = true;
  backdrop.querySelector('[role="dialog"]').focus();
}
function closeModal() {
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => { backdrop.classList.remove('is-open'); backdrop.hidden = true; });
  document.body.classList.remove('modal-open');
  document.querySelector('.workspace').inert = false;
  $('.app-header').inert = false;
  modalPersonId = null;
  previousFocus?.isConnected && previousFocus.focus();
}
function showToast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4200);
}
function closeSearch() {
  $('#search-results').hidden = true;
  $('#search-results').classList.remove('is-open');
  $('#search').setAttribute('aria-expanded', 'false');
}
function searchPeople(value) {
  const results = $('#search-results');
  if (!value.trim()) { closeSearch(); return; }
  const found = individuals.filter((person) => normalize(person.name).includes(normalize(value))).slice(0, 8);
  results.innerHTML = found.length ? found.map((person) => `<button class="search-result" data-search-person="${person.id}">${avatar(person)}<span class="search-result-name">${escapeHTML(person.name)}</span><span class="search-result-meta">G${person.generation + 1}</span></button>`).join('') : '<p class="search-no-results">Nenhum indivíduo encontrado.</p>';
  results.hidden = false;
  results.classList.add('is-open');
  $('#search').setAttribute('aria-expanded', 'true');
}
function exportData() {
  const snapshot = {
    title: 'Entre Laços — Tapirus terrestris',
    source: 'dados.docx',
    notice: 'Rita, Justine, Duda e Wie registradas como fêmeas por confirmação do usuário. Outros sexos e papéis paternos não informados. Características/fotos adicionais podem ser edições locais. Tete Joaninha mantido como nome único; confirmar na fonte.',
    individuals: individuals.map((person) => ({ ...person, ...(profiles[person.id] ? { photo: profiles[person.id].photo || null, characteristics: profiles[person.id].characteristics.split('\n').filter(Boolean) } : {}) })),
    unions,
    stats,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'entre-lacos-dados.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Dados baixados, incluindo as fichas editadas neste navegador.');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (target?.dataset.tab) setTab(target.dataset.tab);
  if (target?.dataset.family) setFocus(target.dataset.family === 'all' ? null : target.dataset.family);
  if (target?.dataset.filter) {
    const filter = target.dataset.filter;
    if (filters.has(filter)) filters.delete(filter); else filters.add(filter);
    target.classList.toggle('active', filters.has(filter));
    target.setAttribute('aria-pressed', String(filters.has(filter)));
    renderNetwork();
  }
  if (target?.dataset.person) openPerson(target.dataset.person, false);
  if (target?.dataset.characterPerson) openPerson(target.dataset.characterPerson, true);
  if (target?.dataset.storyFocus) setFocus(target.dataset.storyFocus);
  if (target?.dataset.searchPerson) { highlightNetworkPerson(target.dataset.searchPerson); closeSearch(); $('#search').value = ''; }
  if (target?.hasAttribute('data-close')) closeModal();
  if (event.target.classList.contains('modal-backdrop')) closeModal();
  if (!event.target.closest('.search-container')) closeSearch();
});
document.addEventListener('keydown', (event) => {
  const openBackdrop = [...document.querySelectorAll('.modal-backdrop')].find((modal) => !modal.hidden);
  if (event.key === 'Escape') { if (openBackdrop) closeModal(); closeSearch(); }
  if (event.key === 'Tab' && openBackdrop) {
    const controls = [...openBackdrop.querySelectorAll('button, a[href], input, textarea, summary, [tabindex="0"]')].filter((element) => element.getClientRects().length && !element.disabled);
    const first = controls[0]; const last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === openBackdrop.querySelector('[role="dialog"]'))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});
$('#search').addEventListener('input', (event) => searchPeople(event.target.value));
$('#search').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') $('#search-results .search-result')?.click();
  if (event.key === 'ArrowDown') { event.preventDefault(); $('#search-results .search-result')?.focus(); }
});
$('#character-search').addEventListener('input', (event) => renderCharacters(event.target.value));
$('#zoom-in').addEventListener('click', () => graph.zoomBy(1.2));
$('#zoom-out').addEventListener('click', () => graph.zoomBy(1 / 1.2));
$('#fit').addEventListener('click', () => graph.fit());
$('#about-button').addEventListener('click', () => openModal($('#about-dialog')));
$('#export-data').addEventListener('click', exportData);
$('#count-individuals').textContent = stats.individuals;
$('#count-generations').textContent = stats.generations;
renderNetwork();
renderCharacters();
renderStories();
