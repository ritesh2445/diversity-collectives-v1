/**
 * Cloudflare Pages Function: Native API Reverse Proxy to Worker Backend
 * Automatically forwards all /api/* requests from Cloudflare Pages (or custom domain)
 * directly to the authoritative Cloudflare Worker backend (dcvc-api).
 */

const WORKER_BACKEND_ORIGIN = 'https://dcvc-api.diversity-collective-vc.workers.dev';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = new URL(url.pathname + url.search, WORKER_BACKEND_ORIGIN);

  // Clone headers and preserve original client IP / host tracking
  const headers = new Headers(context.request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  const proxyRequest = new Request(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.body,
    redirect: 'manual'
  });

  try {
    const response = await fetch(proxyRequest);
    return response;
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Backend gateway timeout connecting to dcvc-api',
      details: err.message
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
