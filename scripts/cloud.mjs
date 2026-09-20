import {readFile,writeFile,chmod} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export const sessionFile=fileURLToPath(new URL('../.crm-session.json',import.meta.url));
export async function saveSession(data){await writeFile(sessionFile,JSON.stringify(data),{mode:0o600});await chmod(sessionFile,0o600);}
export class CloudClient {
 async load(){try{this.auth=JSON.parse(await readFile(sessionFile,'utf8'));}catch{throw new Error('Accesso CRM necessario. Esegui node scripts/crm-login.mjs nel terminale.');}if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(this.auth.url))throw new Error('URL Supabase non valido.');}
 async token(){if(!this.auth)await this.load();if(this.auth.session.expires_at*1000<Date.now()+60000){const r=await fetch(this.auth.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:this.auth.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:this.auth.session.refresh_token}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Sessione scaduta. Ripeti crm-login.mjs.');this.auth.session=await r.json();await saveSession(this.auth);}return this.auth.session.access_token;}
 async request(path,method='GET',body){const token=await this.token();const r=await fetch(this.auth.url+'/rest/v1/'+path,{method,headers:{apikey:this.auth.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.message||'Richiesta CRM non riuscita.');}return r.status===204?null:r.json();}
}
