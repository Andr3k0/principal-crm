import {validateContact} from './core.js';
const KEY='crm-per-siti-demo-v2';
export const demoProfiles=[{id:'crm-user',name:'PrincipalSites',color:'#73a7ff'}];
function seed() {
 const ago=h=>new Date(Date.now()-h*3600000).toISOString();
 const rows=[['Studio Forma','Architettura','Padova','Anteprima 48h',1350,ago(30),'Alta'],['Osteria del Porto','Ristorazione','Chioggia','Da contattare',1350,null,'Alta'],['Atelier Verde','Design','Treviso','Preventivo',2200,null,'Media'],['Officina Nord','Automotive','Mestre','Contattato',1350,null,'Media'],['Casa Luce','Ospitalità','Verona','Brief ricevuto',1350,null,'Alta'],['Studio Arco','Professionisti','Vicenza','Da ricercare',1350,null,'Bassa']];
 return {contacts:rows.map((r,i)=>({id:crypto.randomUUID(),company:r[0],sector:r[1],city:r[2],stage:r[3],outcome:'In corso',owner_id:'crm-user',value:r[4],preview_started_at:r[5],priority:r[6],person:'Referente da verificare',email:`contatto${i+1}@esempio.it`,phone:'',website:'',source:'Esempio dimostrativo',source_url:'',need:'Presentare servizi e progetti con maggiore chiarezza',notes:'Dati inventati per provare il gestionale.',next_action:i===0?'Preparare l’anteprima':'Verificare il prossimo passo',next_at:ago(i===1?2:-24),preview_url:'',do_not_contact:false,created_by:'crm-user',updated_by:'crm-user',created_at:ago(72),updated_at:ago(i+1),version:1})),events:[],drafts:[]};
}
export class DemoStore {
 constructor(){this.demo=true;this.user=demoProfiles[0];try{this.db=JSON.parse(localStorage.getItem(KEY))||seed();}catch{this.db=seed();}this.persist();}
 persist(){localStorage.setItem(KEY,JSON.stringify(this.db));}
 async read(){return {contacts:this.db.contacts.filter(c=>!c.archived_at),events:this.db.events,drafts:this.db.drafts,profiles:demoProfiles};}
 async save(input,existing){const patch=validateContact(input);if(existing && this.db.contacts.find(c=>c.id===existing.id)?.version!==existing.version)throw new Error('Il contatto è cambiato. Aggiorna e riprova.');const row={...existing,...patch,id:existing?.id||crypto.randomUUID(),created_by:existing?.created_by||this.user.id,created_at:existing?.created_at||new Date().toISOString(),updated_by:this.user.id,updated_at:new Date().toISOString(),version:(existing?.version||0)+1};this.db.contacts=this.db.contacts.filter(c=>c.id!==row.id).concat(row);await this.event(row.id,existing?'Contatto aggiornato':'Contatto creato',existing?Object.keys(patch).filter(k=>existing?.[k]!==patch[k]).join(', '):row.company);this.persist();return row;}
 async event(contact_id,kind,body,origin='manual'){this.db.events.unshift({id:crypto.randomUUID(),contact_id,kind,body,origin,actor_id:this.user.id,created_at:new Date().toISOString()});this.persist();}
 async draft(contact_id,body,channel){this.db.drafts.unshift({id:crypto.randomUUID(),contact_id,body,channel,created_by:this.user.id,created_at:new Date().toISOString()});await this.event(contact_id,'Bozza salvata',channel);this.persist();}
 async updateDraft(d,body,channel){const row=this.db.drafts.find(x=>x.id===d.id);if(!row)throw new Error('Bozza non trovata.');row.body=body;row.channel=channel;this.persist();}
 async deleteDraft(d){this.db.drafts=this.db.drafts.filter(x=>x.id!==d.id);this.persist();}
 async archive(c){this.db.contacts.find(r=>r.id===c.id).archived_at=new Date().toISOString();await this.event(c.id,'Contatto archiviato',c.company);}
 async logout(){}
}
export class CloudStore {
 constructor(config){this.config=config;this.demo=false;this.session=JSON.parse(sessionStorage.getItem('crm-supabase-session')||'null');this.user={id:'workspace',name:'CRM condiviso'};}
 async login(email,password){const r=await fetch(`${this.config.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:this.config.key,'Content-Type':'application/json'},body:JSON.stringify({email:'crm-workspace@principalsites.it',password})});if(!r.ok)throw new Error('Password condivisa errata.');this.session=await r.json();sessionStorage.setItem('crm-supabase-session',JSON.stringify(this.session));}
 async request(path,method='GET',body){if(!this.session?.access_token)throw new Error('Sessione scaduta. Accedi di nuovo.');const r=await fetch(`${this.config.url}/rest/v1/${path}`,{method,headers:{apikey:this.config.key,Authorization:`Bearer ${this.session.access_token}`,Prefer:'return=representation','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error((await r.text())||'Operazione non riuscita.');return r.status===204?null:r.json();}
 async all(path){const rows=[];for(let offset=0;;offset+=500){const page=await this.request(`${path}&limit=500&offset=${offset}`);rows.push(...page);if(page.length<500)return rows;}}
 async read(){const [contacts,events,drafts]=await Promise.all([this.all('contacts?archived_at=is.null&order=updated_at.desc,id'),this.all('events?order=created_at.desc,id'),this.all('drafts?order=created_at.desc,id')]);return {contacts,events,drafts,profiles:[this.user]};}
 async save(input,existing){const row={...validateContact(input),owner_id:'workspace',created_by:'workspace',updated_by:'workspace'};const result=await this.request(existing?`contacts?id=eq.${existing.id}&version=eq.${existing.version}`:'contacts',existing?'PATCH':'POST',row);if(!result?.length)throw new Error('Il contatto è stato modificato. Aggiorna e riprova.');return result[0];}
 async event(contact_id,kind,body){await this.request('events','POST',{contact_id,kind,body,origin:'manual',actor_id:'workspace'});}
 async draft(contact_id,body,channel){await this.request('drafts','POST',{contact_id,body,channel,created_by:'workspace'});}
 async updateDraft(d,body,channel){const r=await this.request(`drafts?id=eq.${d.id}`,'PATCH',{body,channel});if(!r?.length)throw new Error('Bozza non trovata.');}
 async deleteDraft(d){const r=await this.request(`drafts?id=eq.${d.id}`,'DELETE');if(!r?.length)throw new Error('Bozza non trovata.');}
 async archive(c){const r=await this.request(`contacts?id=eq.${c.id}&version=eq.${c.version}`,'PATCH',{archived_at:new Date().toISOString()});if(!r?.length)throw new Error('Il contatto è cambiato. Aggiorna prima di archiviarlo.');}
 async logout(){await fetch(`${this.config.url}/auth/v1/logout`,{method:'POST',headers:{apikey:this.config.key,Authorization:`Bearer ${this.session?.access_token||''}`}}).catch(()=>{});sessionStorage.removeItem('crm-supabase-session');this.session=null;}
}
