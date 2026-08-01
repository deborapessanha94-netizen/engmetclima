// Iniciador local do Engmetclima PWA. Não requer bibliotecas adicionais.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = 19010;
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/api/painel-global/ciclones') {
    try {
      const upstream = await fetch('https://www.painelglobal.com.br/furacoes.php?versao=classica', {
        headers: { 'User-Agent': 'Engmetclima/0.1 (monitoramento pessoal)' }
      });
      if (!upstream.ok) throw new Error('Fonte indisponível');
      const data = Buffer.from(await upstream.arrayBuffer());
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=windows-1252',
        'Cache-Control': 'no-store'
      });
      response.end(data);
    } catch {
      response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Não foi possível consultar o Painel Global agora.' }));
    }
    return;
  }

  if (pathname === '/api/dicionario') {
    const word = (url.searchParams.get('palavra') || '').trim();
    if (!/^[\p{L}\s-]{1,80}$/u.test(word)) {
      response.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Palavra inválida.' }));
      return;
    }
    const slug = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '-');
    const source = `https://www.dicio.com.br/${encodeURIComponent(slug)}/`;
    try {
      const upstream = await fetch(source, { headers: { 'User-Agent': 'Engmetclima/0.1 (consulta pessoal)' } });
      if (!upstream.ok) throw new Error('Verbetes indisponíveis');
      const html = await upstream.text();
      const plain = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
      const description = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);
      const meaning = html.match(/<p[^>]*class=["'][^"']*significado[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
      const definition = plain(meaning?.[1] || description?.[1]).slice(0, 550);
      if (!definition) throw new Error('Definição não encontrada');
      response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify({ word, definition, source }));
    } catch {
      response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'Não foi possível encontrar este verbete no Dicio agora.', source }));
    }
    return;
  }

  const file = normalize(join(root, pathname === '/' ? 'index.html' : pathname));

  if (!file.startsWith(root)) {
    response.writeHead(403).end('Acesso não permitido.');
    return;
  }

  try {
    const data = await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    response.end(data);
  } catch {
    response.writeHead(404).end('Arquivo não encontrado.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Engmetclima aberto em http://127.0.0.1:${port}`);
});
