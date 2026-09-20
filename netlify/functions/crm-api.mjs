const allowed = new Set(['contacts','events','drafts']);
const pathPattern = /^(contacts|events|drafts)(?:\?.*)?$/;
export default async (request) => {
  if (request.method !== 'POST') return new Response('Metodo non consentito', {status:405});
  const password = process.env.CRM_SHARED_PASSWORD || '';
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!password || !url || !key) return new Response('CRM non configurato', {status:503});
  const supplied = request.headers.get('x-crm-password') || '';
  if (supplied !== password) return new Response('Password non valida', {status:401});
  let input; try { input = await request.json(); } catch { return new Response('Richiesta non valida', {status:400}); }
  const path = typeof input.path === 'string' ? input.path.replace(/^\//,'') : '';
  const resource = path.split('?')[0];
  if (!allowed.has(resource) || !pathPattern.test(path)) return new Response('Risorsa non consentita', {status:403});
  const method = ['GET','POST','PATCH','DELETE'].includes(input.method) ? input.method : 'GET';
  if (method === 'DELETE' && resource !== 'drafts') return new Response('Cancellazione non consentita', {status:403});
  if (['PATCH','DELETE'].includes(method) && !/[?&]id=eq\.[0-9a-f-]+/.test(path)) return new Response('Modifica senza ID non consentita', {status:400});
  const upstream = await fetch(`${url}/rest/v1/${path}`, {method,headers:{apikey:key,Authorization:`Bearer ${key}`,Prefer:'return=representation','Content-Type':'application/json'},body:input.body===undefined?undefined:JSON.stringify(input.body)});
  return new Response(await upstream.text(),{status:upstream.status,headers:{'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store'}});
};
