/** URL canónica del sitio en producción (con www). */
export const SITE_ORIGIN = 'https://www.tiendasana.shop';

export const DEFAULT_SITE_TITLE = 'Tienda Sana | Productos naturales y reservas online';

export const DEFAULT_SITE_DESCRIPTION =
  'Tienda Sana: compra productos naturales y gestiona reservas en línea de forma sencilla. Envío y atención pensados para ti.';

export const DEFAULT_KEYWORDS =
  'tienda sana, productos naturales, alimentos saludables, compras online, reservas, Colombia';

/** Recorta texto para meta description (Google suele mostrar ~150–160 caracteres). */
export function truncateSeoDescription(text: string, max = 158): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) {
    return t;
  }
  return t.slice(0, max - 1).trimEnd() + '…';
}

export function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_ORIGIN}${path}`;
}
