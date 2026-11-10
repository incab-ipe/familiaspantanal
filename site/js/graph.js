import { individuals, unions, byId, getRelations } from './data.js';

const NS = 'http://www.w3.org/2000/svg';
const svgElement = (tag, attributes = {}, text) => {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
};
export const initials = (name) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

export class GenealogyGraph {
  constructor(svg, { onSelect, onZoom }) {
    this.svg = svg;
    this.world = svg.querySelector('#graph-world');
    this.edges = svg.querySelector('#graph-edges');
    this.nodes = svg.querySelector('#graph-nodes');
    this.onSelect = onSelect;
    this.onZoom = onZoom;
    this.scale = 1;
    this.tx = 0;
    this.ty = 0;
    this.selectedId = null;
    this.filters = new Set(['parent']);
    this.positions = new Map();
    this.visibleIds = new Set();
    this.drag = null;
    this.lastDragged = 0;
    this.installEvents();
    this.observer = new ResizeObserver(() => { if (this.svg.clientWidth) this.fit(); });
    this.observer.observe(svg);
  }

  installEvents() {
    this.svg.addEventListener('wheel', (event) => {
      event.preventDefault();
      const bounds = this.svg.getBoundingClientRect();
      this.zoomBy(event.deltaY < 0 ? 1.12 : 1 / 1.12, event.clientX - bounds.left, event.clientY - bounds.top);
    }, { passive: false });
    this.svg.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this.drag = { x: event.clientX, y: event.clientY, tx: this.tx, ty: this.ty, moved: false, pointerId: event.pointerId };
      this.svg.setPointerCapture(event.pointerId);
    });
    this.svg.addEventListener('pointermove', (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) this.drag.moved = true;
      if (this.drag.moved) {
        this.tx = this.drag.tx + dx;
        this.ty = this.drag.ty + dy;
        this.applyTransform();
      }
    });
    const stopDrag = (event) => {
      if (!this.drag) return;
      const node = this.drag.moved ? null : document.elementFromPoint(event.clientX, event.clientY)?.closest('.graph-node');
      if (this.drag.moved) this.lastDragged = Date.now();
      this.drag = null;
      if (this.svg.hasPointerCapture(event.pointerId)) this.svg.releasePointerCapture(event.pointerId);
      if (node?.getAttribute('data-id')) this.onSelect(node.getAttribute('data-id'));
    };
    this.svg.addEventListener('pointerup', stopDrag);
    this.svg.addEventListener('pointercancel', () => { this.drag = null; });
  }

  render(ids, selectedId = null, filters = this.filters, photos = {}) {
    this.visibleIds = new Set(ids);
    this.selectedId = selectedId;
    this.filters = new Set(filters);
    this.photos = photos;
    this.positions.clear();
    this.edges.replaceChildren();
    this.nodes.replaceChildren();
    const visible = individuals.filter((person) => this.visibleIds.has(person.id));
    const rows = [...new Set(visible.map((person) => person.generation))].sort((a, b) => a - b);
    const ordered = new Map();
    const founderOrder = ['bandaid', 'rita', 'benjamin', 'justine', 'felipe', 'duda', 'caio', 'wie', 'brutus', 'sergiao', 'sachin', 'nelsao'];
    const secondGenerationOrder = ['doinho', 'donna', 'namorado', 'nic', 'morena', 'vivek', 'jamie', 'ariel', 'manchinha', 'rupert', 'ted', 'columbus', 'little-bro', 'paula', 'valentina', 'panqueca', 'mucci', 'michele', 'joao-guilherme', 'bastardo'];
    for (const generation of rows) {
      const row = visible.filter((person) => person.generation === generation);
      if (generation === 0) row.sort((a, b) => founderOrder.indexOf(a.id) - founderOrder.indexOf(b.id));
      else if (generation === 1) row.sort((a, b) => secondGenerationOrder.indexOf(a.id) - secondGenerationOrder.indexOf(b.id));
      else {
        const sourceOrder = unions.flatMap((union) => union.children);
        row.sort((a, b) => sourceOrder.indexOf(a.id) - sourceOrder.indexOf(b.id));
      }
      ordered.set(generation, row);
    }
    const maxCount = Math.max(1, ...[...ordered.values()].map((row) => row.length));
    const step = 146;
    this.contentWidth = Math.max(610, maxCount * step + 60);
    this.contentHeight = rows.length > 1 ? 120 + (rows.length - 1) * 245 + 90 : 300;
    rows.forEach((generation, rowIndex) => {
      const row = ordered.get(generation);
      const start = (this.contentWidth - (row.length - 1) * step) / 2;
      const y = 95 + rowIndex * 245;
      row.forEach((person, index) => this.positions.set(person.id, { x: start + index * step, y }));
      const rowTitle = generation === 0 ? '1ª GERAÇÃO · MATRIZES CENTRAIS E SEUS CASAIS' : generation === 1 ? '2ª GERAÇÃO · NOVOS NÚCLEOS E DESCENDENTES' : '3ª GERAÇÃO · DESCENDENTES';
      this.edges.append(svgElement('text', { x: 20, y: y - 66, class: 'generation-label' }, rowTitle));
      this.edges.append(svgElement('path', { d: `M20 ${y - 49} H${this.contentWidth - 20}`, class: 'generation-rule' }));
    });
    this.addDefinitions();
    this.renderSecondGenerationGroups();
    this.renderEdges();
    visible.forEach((person) => this.renderNode(person));
    this.highlight(selectedId);
    requestAnimationFrame(() => this.fit());
  }

  renderSecondGenerationGroups() {
    const pairs = [['donna', 'namorado'], ['morena', 'vivek'], ['ariel', 'jamie']];
    for (const pair of pairs) {
      if (!pair.every((id) => this.positions.has(id))) continue;
      const [first, second] = pair.map((id) => this.positions.get(id));
      if (first.y !== second.y) continue;
      const left = Math.min(first.x, second.x) - 51;
      const right = Math.max(first.x, second.x) + 51;
      const group = svgElement('g', { class: 'second-generation-pair', 'data-pair': pair.join(' ') });
      group.append(svgElement('rect', { x: left, y: first.y - 63, width: right - left, height: 150, rx: 10, class: 'pair-frame' }));
      group.append(svgElement('text', { x: (left + right) / 2, y: first.y - 47, 'text-anchor': 'middle', class: 'pair-kicker' }, 'NOVO NÚCLEO · 2ª GERAÇÃO'));
      this.edges.append(group);
    }
  }

  addDefinitions() {
    this.svg.querySelector('defs')?.remove();
    const definitions = svgElement('defs');
    const marker = svgElement('marker', { id: 'offspring-arrow', viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 5, markerHeight: 5, orient: 'auto' });
    marker.append(svgElement('path', { d: 'M1 1L7 4L1 7', fill: 'none', stroke: '#848779', 'stroke-width': 1.3 }));
    definitions.append(marker);
    for (const [id, point] of this.positions) {
      const clip = svgElement('clipPath', { id: `photo-clip-${id}` });
      clip.append(svgElement('circle', { cx: point.x, cy: point.y, r: 28 }));
      definitions.append(clip);
    }
    this.svg.prepend(definitions);
  }

  renderEdges() {
    const activeUnions = unions.filter((union) => union.parents.every((id) => this.visibleIds.has(id)));
    activeUnions.forEach((union, index) => {
      const [first, second] = union.parents.map((id) => this.positions.get(id));
      const sameRow = first.y === second.y;
      const isSecondPair = [['donna', 'namorado'], ['morena', 'vivek'], ['ariel', 'jamie']].some((pair) => pair.every((id) => union.parents.includes(id)));
      const busY = isSecondPair && sameRow ? first.y + 8 : Math.max(first.y, second.y) + 102 + (index % 4) * 13;
      const centerX = (first.x + second.x) / 2;
      const direction = Math.sign(second.x - first.x) || 1;
      const path = isSecondPair && sameRow
        ? `M${first.x + direction * 33} ${first.y + 8} H${second.x - direction * 33}`
        : sameRow
        ? `M${first.x + direction * 33} ${first.y + 8} H${first.x + direction * 48} V${busY} H${second.x - direction * 48} V${second.y + 8} H${second.x - direction * 33}`
        : `M${first.x + (second.x > first.x ? 34 : -34)} ${first.y} C${centerX} ${first.y}, ${centerX} ${second.y}, ${second.x + (first.x > second.x ? 34 : -34)} ${second.y}`;
      this.addEdge(path, isSecondPair ? 'edge-partner edge-second-pair' : 'edge-partner', union.parents, `${byId.get(union.parents[0]).name} + ${byId.get(union.parents[1]).name}`);
      if (this.filters.has('parent')) {
        for (const childId of union.children.filter((id) => this.visibleIds.has(id))) {
          const child = this.positions.get(childId);
          if (sameRow) {
            const midY = (busY + child.y - 36) / 2;
            this.addEdge(`M${centerX} ${busY} V${midY - 10} Q${centerX} ${midY} ${centerX + Math.sign(child.x - centerX) * 10} ${midY} H${child.x - Math.sign(child.x - centerX) * 10} Q${child.x} ${midY} ${child.x} ${midY + 10} V${child.y - 37}`, 'edge-parent', [...union.parents, childId], `Genitores de ${byId.get(childId).name}`);
          } else {
            for (const parentId of union.parents) this.directParentEdge(parentId, childId);
          }
        }
      }
    });
    if (this.filters.has('parent')) {
      for (const union of unions) {
        if (union.parents.every((id) => this.visibleIds.has(id))) continue;
        for (const parentId of union.parents.filter((id) => this.visibleIds.has(id))) {
          for (const childId of union.children.filter((id) => this.visibleIds.has(id))) this.directParentEdge(parentId, childId);
        }
      }
    }
    const drawn = new Set();
    for (const id of this.visibleIds) {
      const relationships = getRelations(id);
      const connections = [
        ...(this.filters.has('sibling') ? relationships.siblings.map((siblingId) => ({ id: siblingId, type: 'sibling' })) : []),
        ...(this.filters.has('half') ? relationships.halfSiblings.map((relation) => ({ id: relation.id, type: 'half' })) : []),
      ];
      for (const relation of connections) {
        if (!this.visibleIds.has(relation.id)) continue;
        const key = [id, relation.id].sort().join(':');
        if (drawn.has(key)) continue;
        drawn.add(key);
        const a = this.positions.get(id);
        const b = this.positions.get(relation.id);
        const arc = 40 + Math.min(80, Math.abs(a.x - b.x) / 7);
        this.addEdge(`M${a.x} ${a.y - 34} C${a.x} ${a.y - arc}, ${b.x} ${b.y - arc}, ${b.x} ${b.y - 34}`, `edge-${relation.type}`, [id, relation.id], relation.type === 'sibling' ? 'Irmãos: dois genitores compartilhados' : 'Meio-irmãos: um genitor compartilhado');
      }
    }
  }

  directParentEdge(parentId, childId) {
    const a = this.positions.get(parentId);
    const b = this.positions.get(childId);
    const mid = (a.y + b.y) / 2;
    this.addEdge(`M${a.x} ${a.y + 34} C${a.x} ${mid}, ${b.x} ${mid}, ${b.x} ${b.y - 37}`, 'edge-parent', [parentId, childId], `${byId.get(parentId).name} é genitor de ${byId.get(childId).name}`);
  }

  addEdge(d, className, ids, title) {
    const edge = svgElement('path', { d, class: `graph-edge ${className}`, 'data-ids': ids.join(' '), ...(className === 'edge-parent' ? { 'marker-end': 'url(#offspring-arrow)' } : {}) });
    edge.append(svgElement('title', {}, title));
    this.edges.append(edge);
  }

  renderNode(person) {
    const { x, y } = this.positions.get(person.id);
    const relationships = getRelations(person.id);
    const group = svgElement('g', { class: `graph-node${person.isMatriarch ? ' is-matriarch' : ''}`, 'data-id': person.id, role: 'button', tabindex: 0, 'aria-label': `${person.name}${person.isMatriarch ? ', fêmea e matriarca em destaque' : ''}, abrir ficha, ${relationships.children.length} filhotes registrados` });
    group.append(svgElement('title', {}, `${person.name} · Clique para conhecer os vínculos`));
    group.append(svgElement('circle', { cx: x, cy: y, r: person.isMatriarch ? 41 : 35, class: 'node-ring' }));
    if (person.isMatriarch) group.append(svgElement('circle', { cx: x, cy: y, r: 35, class: 'node-halo' }));
    group.append(svgElement('circle', { cx: x, cy: y, r: person.isMatriarch ? 30 : 28, class: 'node-fill' }));
    const photo = this.photos[person.id] || person.photo;
    if (photo) {
      const image = svgElement('image', { x: x - 28, y: y - 28, width: 56, height: 56, href: photo, 'clip-path': `url(#photo-clip-${person.id})`, preserveAspectRatio: 'xMidYMid slice', class: 'node-photo' });
      image.style.clipPath = `url(#photo-clip-${person.id})`;
      image.addEventListener('error', () => image.remove());
      group.append(svgElement('text', { x, y: y + 6, class: 'node-initial', 'text-anchor': 'middle' }, initials(person.name)));
      group.append(image);
    } else group.append(svgElement('text', { x, y: y + 6, class: 'node-initial', 'text-anchor': 'middle' }, initials(person.name)));
    group.append(svgElement('text', { x, y: y + 57, class: 'node-label', 'text-anchor': 'middle' }, person.name));
    if (person.isMatriarch) group.append(svgElement('text', { x, y: y + 76, class: 'node-matriarch-tag', 'text-anchor': 'middle' }, 'FÊMEA · MATRIZ'));
    else if (relationships.partners.length > 1) group.append(svgElement('text', { x, y: y + 75, class: 'node-sub', 'text-anchor': 'middle' }, `${relationships.partners.length} PARCERIAS`));
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.onSelect(person.id); }
    });
    this.nodes.append(group);
  }

  highlight(id) {
    this.selectedId = id;
    const relevant = id ? new Set([id, ...getRelations(id).parents, ...getRelations(id).partners, ...getRelations(id).children, ...getRelations(id).siblings, ...getRelations(id).halfSiblings.map((relation) => relation.id)]) : null;
    this.nodes.querySelectorAll('.graph-node').forEach((node) => {
      node.classList.toggle('selected', node.getAttribute('data-id') === id);
      node.classList.toggle('is-muted', !!relevant && !relevant.has(node.getAttribute('data-id')));
    });
    this.edges.querySelectorAll('.graph-edge').forEach((edge) => {
      const ids = edge.getAttribute('data-ids').split(' ');
      edge.classList.toggle('is-muted', !!id && !ids.includes(id));
    });
  }

  fit() {
    if (!this.contentWidth || !this.svg.clientWidth || !this.svg.clientHeight) return;
    this.scale = Math.min(1.18, (this.svg.clientWidth - 36) / this.contentWidth, (this.svg.clientHeight - 64) / this.contentHeight);
    this.tx = (this.svg.clientWidth - this.contentWidth * this.scale) / 2;
    this.ty = (this.svg.clientHeight - this.contentHeight * this.scale) / 2 - 4;
    this.applyTransform();
  }

  zoomBy(factor, x = this.svg.clientWidth / 2, y = this.svg.clientHeight / 2) {
    const next = Math.max(0.15, Math.min(3, this.scale * factor));
    const ratio = next / this.scale;
    this.tx = x - (x - this.tx) * ratio;
    this.ty = y - (y - this.ty) * ratio;
    this.scale = next;
    this.applyTransform();
  }

  applyTransform() {
    this.world.setAttribute('transform', `translate(${this.tx} ${this.ty}) scale(${this.scale})`);
    this.onZoom?.(Math.round(this.scale * 100));
  }
}
