import readline from 'node:readline';
import {Writable} from 'node:stream';
import {saveSession,sessionFile} from './cloud.mjs';
import {unlink} from 'node:fs/promises';
if(process.argv.includes('--logout')){await unlink(sessionFile).catch(()=>{});console.log('Sessione locale rimossa. Riavvia il server MCP in Codex.');process.exit(0);}
let hidden=false;
const output=new Writable({write(chunk,encoding,callback){if(!hidden)process.stdout.write(chunk);callback();}});
const rl=readline.createInterface({input:process.stdin,output,terminal:true});
const ask=text=>new Promise(resolve=>rl.question(text,resolve));
try {
 const url=(await ask('URL progetto Supabase: ')).trim().replace(/\/$/,'');
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw new Error('URL Supabase non valido.');
 const key=(await ask('Chiave pubblica (publishable/anon): ')).trim();
 if(key.startsWith('sb_secret_'))throw new Error('Non usare chiavi segrete.');
 const email=(await ask('Email personale del CRM: ')).trim();
 process.stdout.write('Password CRM (nascosta): ');hidden=true;
 const password=await ask('');hidden=false;process.stdout.write('\n');
 const r=await fetch(url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error('Accesso non riuscito. Verifica email e password.');
 const session=await r.json();
 const check=await fetch(url+'/rest/v1/profiles?id=eq.'+session.user.id,{headers:{apikey:key,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(15000)});
 if(!check.ok||!(await check.json()).length)throw new Error('Utente non autorizzato al CRM.');
 await saveSession({url,key,session});console.log('Collegamento pronto. La password non viene salvata. Sessione locale privata creata.');
} catch(err){console.error(err.message);process.exitCode=1;}finally{rl.close();}
