import { waitUntil } from '@vercel/functions';

export const config = { runtime: 'edge' };

const OPENCLAW_URL = 'https://openclawhq.app/api/billing/webhook';
const DOODLEDUEL_URL = 'https://doodleduel.ai/api/dodo/webhook';

const DOODLEDUEL_PRODUCTS = new Set([
  'pdt_0NcQgJ6cnG2Pax8bi8qNF', // DoodleDuel Lifetime Pro
  'pdt_0NcQiC5Gb2G56VZwr78O6', // DoodleDuel Arcade Lives
]);

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000];

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await request.text();

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const destination = resolveDestination(payload);

  const forwardHeaders = {
    'content-type': request.headers.get('content-type') || 'application/json',
  };
  for (const key of ['webhook-id', 'webhook-signature', 'webhook-timestamp']) {
    const value = request.headers.get(key);
    if (value) forwardHeaders[key] = value;
  }

  waitUntil(forwardWithRetry(destination, rawBody, forwardHeaders, payload));

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function resolveDestination(payload) {
  const productId = payload.data?.product_id;

  if (productId && DOODLEDUEL_PRODUCTS.has(productId)) {
    return DOODLEDUEL_URL;
  }

  return OPENCLAW_URL;
}

async function forwardWithRetry(url, body, headers, payload) {
  const label = `${payload.type} -> ${url}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      if (res.ok) {
        console.log(`[webhook-proxy] ${label} (${res.status})`);
        return;
      }
      console.error(`[webhook-proxy] ${label} failed (${res.status})`);
    } catch (err) {
      console.error(`[webhook-proxy] ${label} error: ${err.message}`);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }

  console.error(`[webhook-proxy] ${label} retries exhausted`);
}
