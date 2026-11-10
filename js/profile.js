export function validatePhotoSource(value, baseURI) {
  const source = String(value || '').trim();
  if (!source) return '';
  let url;
  try { url = new URL(source, baseURI); } catch { throw new Error('Use uma URL HTTPS válida ou um caminho relativo de imagem.'); }
  const absolute = /^[a-z][a-z0-9+.-]*:|^\/\//i.test(source);
  if (!['http:', 'https:'].includes(url.protocol) || (absolute && url.protocol !== 'https:')) {
    throw new Error('Use uma URL https:// ou um caminho relativo de imagem. URLs HTTP não são aceitas.');
  }
  return source;
}
