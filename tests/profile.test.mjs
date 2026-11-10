import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePhotoSource } from '../site/js/profile.js';

const githubBase = 'https://example.github.io/entre-lacos/site/';

test('aceita foto HTTPS e preserva caminhos relativos em GitHub Pages', () => {
  assert.equal(validatePhotoSource('https://example.org/benjamin.jpg', githubBase), 'https://example.org/benjamin.jpg');
  assert.equal(validatePhotoSource('./assets/individuos/benjamin.jpg', githubBase), './assets/individuos/benjamin.jpg');
});
test('permite caminhos locais relativos no servidor HTTP de desenvolvimento', () => {
  assert.equal(validatePhotoSource('./assets/test.jpg', 'http://localhost:3000/'), './assets/test.jpg');
});
test('rejeita foto absoluta HTTP e esquemas não seguros', () => {
  for (const source of ['http://example.org/photo.jpg', 'javascript:alert(1)', 'data:image/png;base64,abc', 'file:///tmp/photo.jpg']) {
    assert.throws(() => validatePhotoSource(source, githubBase));
  }
  assert.throws(() => validatePhotoSource('//example.org/photo.jpg', 'http://localhost:3000/'));
});
test('campo vazio remove a foto sem criar URL', () => {
  assert.equal(validatePhotoSource('  ', githubBase), '');
});
