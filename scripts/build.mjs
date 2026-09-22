import { cp, mkdir, writeFile, rm } from 'node:fs/promises';
const url = process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
if (!!url !== !!key) throw new Error('Configurare entrambe le variabili Supabase.');
if (!url || !key) throw new Error('Configurare PUBLIC_SUPABASE_URL e PUBLIC_SUPABASE_ANON_KEY prima del deploy.');
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) throw new Error('SUPABASE_URL non valido.');
if (key.startsWith('sb_secret_')) throw new Error('Usare solo una chiave pubblica, mai una chiave segreta.');
if (key.split('.').length === 3) {
  const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  if (payload.role !== 'anon') throw new Error('È consentita solo la chiave anon.');
}
await rm('dist', {recursive:true, force:true});
await mkdir('dist', {recursive:true});
await cp('public', 'dist', {recursive:true});
await writeFile('dist/config.js', `window.CRM_CONFIG = ${JSON.stringify({url,key})};\n`);
console.log('Build pronta: collegamento Supabase configurato.');
