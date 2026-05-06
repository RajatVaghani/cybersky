import { waitUntil } from '@vercel/functions';

export const config = { runtime: 'edge' };

const OPENCLAW_URL = 'https://openclawhq.app/api/billing/webhook';
const DOODLEDUEL_URL = 'https://doodleduel.ai/api/dodo/webhook';
const BEEP_URL = 'https://trybeep.app/api/webhooks/dodo';
const SNAPSITE_URL = 'https://api.snapsiteux.com/api/webhooks/dodo';
const EASYQUERY_URL = 'https://easyquery.app/api/dodo-webhook';

const DOODLEDUEL_PRODUCTS = new Set([
  'pdt_0NcQgJ6cnG2Pax8bi8qNF', // DoodleDuel Lifetime Pro
  'pdt_0NcQiC5Gb2G56VZwr78O6', // DoodleDuel Arcade Lives
]);

const BEEP_PRODUCTS = new Set([
  'pdt_0NcQerK2z4uHMpsJmt2hU', // Beep Pro Monthly
  'pdt_0NcQgFgSWdGyPWbC1vkyg', // Beep Pro Yearly
]);

const SNAPSITE_PRODUCTS = new Set([
  'pdt_0NdWMEtKlhUlBRiqW8jYP', // Snap Site Pro Monthly
  'pdt_0NdWMMip0aPu0IuyY5zVs', // Snap Site Pro Yearly
  'pdt_0NdWMInWWmyefqJElPo1f', // Snap Site Agency Monthly
  'pdt_0NdWMQzQobFQHEsHCoQSE', // Snap Site Agency Yearly
  'pdt_0NdWMY8DsIVNQoNuv0Srd', // Snap Site 50 Credit Top-up
  'pdt_0NdWMg7xPzmURjvnrgyqh', // Snap Site 150 Credit Top-up
  'pdt_0NdWMmr1fYPUnD1lpxlN9', // Snap Site 500 Credit Top-up
]);

const EASYQUERY_PRODUCTS = new Set([
  'pdt_0NeFaCZUAB4QxnZuaYdx8', // EasyQuery Pro Monthly
  'pdt_0NeFaGzlq4qog1hmSSpj6', // EasyQuery Pro Yearly
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
    console.error('[webhook-proxy] Invalid JSON body');
    return new Response('Invalid JSON', { status: 400 });
  }

  const data = payload.data || {};
  const productId = data.product_cart?.[0]?.product_id
    || data.product_id
    || data.items?.[0]?.product_id;

  const destination = resolveDestination(payload);

  console.log(`[webhook-proxy] Received: ${payload.type} | product: ${productId || 'none'} | customer: ${data.customer?.email || 'unknown'} | dest: ${destination}`);

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
  const data = payload.data || {};
  const productId = data.product_cart?.[0]?.product_id
    || data.product_id
    || data.items?.[0]?.product_id;

  if (productId && DOODLEDUEL_PRODUCTS.has(productId)) {
    return DOODLEDUEL_URL;
  }

  if (productId && BEEP_PRODUCTS.has(productId)) {
    return BEEP_URL;
  }

  if (productId && SNAPSITE_PRODUCTS.has(productId)) {
    return SNAPSITE_URL;
  }

  if (productId && EASYQUERY_PRODUCTS.has(productId)) {
    return EASYQUERY_URL;
  }

  return OPENCLAW_URL;
}

async function forwardWithRetry(url, body, headers, payload) {
  const label = `${payload.type} -> ${url}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      const resBody = await res.text().catch(() => '');
      if (res.ok) {
        console.log(`[webhook-proxy] OK ${label} (${res.status}) ${resBody}`);
        return;
      }
      console.error(`[webhook-proxy] FAIL ${label} attempt=${attempt + 1} status=${res.status} body=${resBody}`);
    } catch (err) {
      console.error(`[webhook-proxy] ERROR ${label} attempt=${attempt + 1} ${err.message}`);
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }

  console.error(`[webhook-proxy] EXHAUSTED ${label} -- all ${MAX_RETRIES + 1} attempts failed`);
}
