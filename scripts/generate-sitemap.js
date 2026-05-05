const { mkdir, writeFile } = require('node:fs/promises');
const { dirname, join } = require('node:path');

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://www.tiendasana.shop';
const PUBLICO_SERVICE_URL = process.env.PUBLICO_SERVICE_URL || 'http://localhost:8080/api/public';
const outputPath = join(process.cwd(), 'public', 'sitemap.xml');

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function urlEntry(loc, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    changefreq ? `    <changefreq>${escapeXml(changefreq)}</changefreq>` : null,
    priority != null ? `    <priority>${priority.toFixed(1)}</priority>` : null,
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${url}`);
  }
  return res.json();
}

async function fetchAllPages(endpoint, collectionKey) {
  const results = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const data = await fetchJson(`${PUBLICO_SERVICE_URL}/${endpoint}/${page}`);
    const reply = data?.reply ?? data ?? {};
    totalPages = Number(reply.totalPaginas ?? reply.totalPages ?? 1);
    const items = Array.isArray(reply[collectionKey]) ? reply[collectionKey] : [];
    results.push(...items);
    page += 1;
  }

  return results;
}

async function generateSitemap() {
  const urls = [
    urlEntry(`${SITE_ORIGIN}/`, 'daily', 1.0),
  ];

  try {
    const [products, mesas] = await Promise.all([
      fetchAllPages('productos/get-all', 'productos'),
      fetchAllPages('mesas/get-all', 'mesas'),
    ]);

    for (const product of products) {
      if (product?.id) {
        urls.push(urlEntry(`${SITE_ORIGIN}/detalle-producto/${product.id}`, 'weekly', 0.8));
      }
    }

    for (const mesa of mesas) {
      if (mesa?.id) {
        urls.push(urlEntry(`${SITE_ORIGIN}/mesas/${mesa.id}`, 'weekly', 0.8));
      }
    }
  } catch (error) {
    console.warn('[sitemap] Could not fetch dynamic URLs, generating static sitemap only:', error.message);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, xml, 'utf8');
  console.log(`[sitemap] Generated ${outputPath}`);
}

generateSitemap().catch((error) => {
  console.error('[sitemap] Failed to generate sitemap:', error);
  process.exitCode = 1;
});