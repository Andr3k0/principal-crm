import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
test('MCP: negoziazione, strumenti e rifiuto di scritture non valide',async()=>{
 const p=spawn(process.execPath,['scripts/crm-mcp.mjs'],{stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);
 p.stdin.end([{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26'}},{jsonrpc:'2.0',id:2,method:'tools/list'},{jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'crm_update_contact',arguments:{id:'bad',expected_version:1,payload:{created_by:'forged'}}}}].map(x=>JSON.stringify(x)).join('\n')+'\n');
 const code=await new Promise(resolve=>p.on('close',resolve));assert.equal(code,0,err);const r=out.trim().split('\n').map(x=>JSON.parse(x));assert.equal(r[0].result.protocolVersion,'2025-03-26');assert.equal(r[1].result.tools.length,6);assert.equal(r[2].result.isError,true);assert.match(r[2].result.content[0].text,/Campo non consentito/);
});
