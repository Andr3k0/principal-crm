import test from 'node:test';
import assert from 'node:assert/strict';
import {validateContact,deadline,remaining,safeURL,escapeHTML,csvExport,draftTemplate,contextForAI} from '../public/core.js';
test('validazione: blocca importi negativi, URL eseguibili, fasi errate e identità contraffatte',()=>{
 assert.throws(()=>validateContact({value:-1}));assert.throws(()=>validateContact({website:'javascript:alert(1)'}));assert.throws(()=>validateContact({stage:'fake'}));assert.deepEqual(validateContact({company:' Test ',person:' Mario Rossi ',email:' MARIO@EXAMPLE.IT ',created_by:'fake'}),{company:'Test',person:'Mario Rossi',email:'mario@example.it'});
});
test('48 ore reali, inclusi cambio giorno e scadenza',()=>{const c={preview_started_at:'2026-03-28T12:00:00Z'};assert.equal(deadline(c).toISOString(),'2026-03-30T12:00:00.000Z');assert.equal(remaining(c,Date.parse('2026-03-30T14:00:00Z')),'2h di ritardo');});
test('contenuti non eseguibili e CSV protetto da formule',()=>{assert.equal(safeURL('javascript:alert(1)'),'');assert.equal(escapeHTML('<script>'),'&lt;script&gt;');assert.match(csvExport([{company:'=1+1'}]),/"'=1\+1"/);});
test('modelli rispettano esclusione contatti e distinguono anteprima e consegna',()=>{assert.throws(()=>draftTemplate({do_not_contact:true}));assert.match(contextForAI({company:'Test'}),/Non promettere la consegna finale in 48 ore/);assert.match(draftTemplate({company:'Test'}),/anteprima gratuita/);});
