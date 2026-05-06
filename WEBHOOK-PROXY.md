# Dodo Payments Webhook Proxy

thecybersky.com acts as a webhook proxy (fan-out) for Dodo Payments. Dodo only supports a single webhook URL per account, but we run multiple products under one account using Dodo's multi-brand feature. This proxy receives all webhooks and routes them to the correct downstream service.

## Architecture

```
Dodo Payments
      |
      | POST https://thecybersky.com/api/webhook
      v
 thecybersky (Vercel Edge Function)
      |
      |--- product matches DoodleDuel? --> https://doodleduel.ai/api/dodo/webhook
      |
      |--- product matches Beep? -------> https://trybeep.app/api/webhooks/dodo
      |
      |--- product matches Snap Site? --> https://api.snapsiteux.com/api/webhooks/dodo
      |
      |--- product matches EasyQuery? --> https://easyquery.app/api/dodo-webhook
      |
      |--- everything else (default) ----> https://openclawhq.app/api/billing/webhook
```

## How it works

1. Dodo sends a webhook to `https://thecybersky.com/api/webhook`
2. The proxy immediately returns `200 { received: true }` to Dodo
3. In the background (via `waitUntil`), the proxy forwards the original request to the correct destination
4. The raw body and signature headers (`webhook-id`, `webhook-signature`, `webhook-timestamp`) are forwarded untouched so downstream services can verify the signature themselves
5. If forwarding fails, the proxy retries up to 3 additional times with delays of 1s, 3s, and 10s

## Routing logic

Routing is based on `product_id` extracted from the webhook payload:

- **Payment events** (`payment.succeeded`, etc.): product ID is at `data.product_cart[0].product_id`
- **Subscription events** (`subscription.active`, etc.): product ID is at `data.product_id`

The proxy checks all three possible locations as a fallback chain:
```
data.product_cart[0].product_id  -->  data.product_id  -->  data.items[0].product_id
```

### DoodleDuel products (route to doodleduel.ai)

| Product | ID | Type |
|---|---|---|
| Lifetime Pro | `pdt_0NcQgJ6cnG2Pax8bi8qNF` | One-time payment |
| Arcade Lives | `pdt_0NcQiC5Gb2G56VZwr78O6` | One-time payment |

### Beep products (route to trybeep.app)

Beep Pro is a single-tier subscription billed monthly or yearly. Both
intervals route to the same downstream URL — Beep itself decides which
interval applied based on `payment_frequency_interval` in the payload.

| Product | ID | Type |
|---|---|---|
| Beep Pro Monthly | _add once created in Dodo dashboard_ | Subscription |
| Beep Pro Yearly  | _add once created in Dodo dashboard_ | Subscription |

Update the `BEEP_PRODUCTS` set in `api/webhook.js` once the products
exist in the Dodo dashboard, and push.

### Snap Site products (route to api.snapsiteux.com)

| Product | ID | Type |
|---|---|---|
| Pro Monthly | `pdt_0NdWMEtKlhUlBRiqW8jYP` | Subscription |
| Pro Yearly | `pdt_0NdWMMip0aPu0IuyY5zVs` | Subscription |
| Agency Monthly | `pdt_0NdWMInWWmyefqJElPo1f` | Subscription |
| Agency Yearly | `pdt_0NdWMQzQobFQHEsHCoQSE` | Subscription |
| 50 Credit Top-up | `pdt_0NdWMY8DsIVNQoNuv0Srd` | One-time payment |
| 150 Credit Top-up | `pdt_0NdWMg7xPzmURjvnrgyqh` | One-time payment |
| 500 Credit Top-up | `pdt_0NdWMmr1fYPUnD1lpxlN9` | One-time payment |

### EasyQuery products (route to easyquery.app)

| Product | ID | Type |
|---|---|---|
| Pro Monthly | `pdt_0NeFaCZUAB4QxnZuaYdx8` | Subscription |
| Pro Yearly | `pdt_0NeFaGzlq4qog1hmSSpj6` | Subscription |

### OpenClaw products (route to openclawhq.app)

Everything else, including all subscription plans (Starter, Standard, Pro, Power), Vision licenses, and any future products. OpenClaw is the default destination -- no product IDs need to be registered here.

## Adding a new DoodleDuel product

Add the product ID to the `DOODLEDUEL_PRODUCTS` set in `api/webhook.js` and push to GitHub (auto-deploys via Vercel).

## Adding a new brand/service

1. Add a new URL constant (e.g. `const NEWBRAND_URL = '...'`)
2. Add a new product ID set (e.g. `const NEWBRAND_PRODUCTS = new Set([...])`)
3. Add a check in `resolveDestination()` before the default return

## Webhook signature verification

The proxy does NOT verify webhook signatures. It forwards the raw body and all signature headers unchanged. Each downstream service verifies the signature independently using the `standardwebhooks` library and `DODO_WEBHOOK_SECRET`.

All downstream services must use the same `DODO_WEBHOOK_SECRET` -- the one associated with the `thecybersky.com/api/webhook` endpoint in the Dodo dashboard. Dodo generates a unique signing secret per webhook URL, so if the URL changes, the secret changes and all downstream services need updating.

## Supported Dodo event types

| Event | Payload type | Has product_cart | Has data.product_id |
|---|---|---|---|
| `payment.succeeded` | Payment | Yes | No |
| `subscription.active` | Subscription | No | Yes |
| `subscription.cancelled` | Subscription | No | Yes |
| `subscription.expired` | Subscription | No | Yes |
| `subscription.failed` | Subscription | No | Yes |
| `subscription.on_hold` | Subscription | No | Yes |
| `subscription.plan_changed` | Subscription | No | Yes |
| `subscription.renewed` | Subscription | No | Yes |
| `subscription.updated` | Subscription | No | Yes |

## Logs

All activity is logged to Vercel function logs (visible at vercel.com > thecybersky > Logs):

- **On receive:** `[webhook-proxy] Received: payment.succeeded | product: pdt_... | customer: user@email.com | dest: https://...`
- **On forward success:** `[webhook-proxy] OK payment.succeeded -> https://... (200) {"received":true}`
- **On forward failure:** `[webhook-proxy] FAIL payment.succeeded -> https://... attempt=1 status=401 body=...`
- **On retries exhausted:** `[webhook-proxy] EXHAUSTED payment.succeeded -> https://... -- all 4 attempts failed`

## Testing

Run the test script to send a mock DoodleDuel Lifetime Pro payment through the proxy:

```bash
node test-webhook.js
```

Note: downstream will reject the test payload due to the fake signature (expected). The test verifies that the proxy itself accepts and routes correctly.

## Deployment

Hosted on Vercel as an Edge Function. Pushes to `master` auto-deploy.

## Gotchas

- **Domain redirect:** The Vercel project must have the bare domain (`thecybersky.com`) as the primary domain, not `www.thecybersky.com`. Dodo does not follow 307 redirects, so a www-redirect would cause all webhook deliveries to fail.
- **Signing secret is per-URL:** If the webhook URL in Dodo's dashboard changes, a new signing secret is generated. All downstream services need the updated secret.
- **Edge runtime:** The function runs on Vercel's Edge runtime for fast cold starts and access to the raw request body via `request.text()`.
