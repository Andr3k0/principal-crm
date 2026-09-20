import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root = resolve('public');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
createServer(async(req,res)=>{
 try {
  const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
  if (!file.startsWith(root + '/')) {res.writeHead(403).end(); return;}
  const contents=await readFile(file);
  res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
  res.end(contents);
 } catch {res.writeHead(404).end('Non trovato');}
}).listen(4173,'127.0.0.1',()=>console.log('CRM: http://127.0.0.1:4173'));
