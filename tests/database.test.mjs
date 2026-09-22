import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('database: workspace unico senza utenti o profili', async () => {
 const db = new PGlite();
 try {
  await db.exec("create role anon; create role authenticated; create schema auth; create function auth.uid() returns uuid language sql stable as $$select '11111111-1111-4111-8111-111111111111'::uuid$$;");
  await db.exec(await readFile(new URL('../database/001_schema.sql', import.meta.url), 'utf8'));
  const tables = (await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(r=>r.tablename);
  assert.deepEqual(tables, ['contacts','drafts','events']);
  const c = (await db.query("insert into contacts(company,person,email) values('Test','Mario Rossi','mario@example.it') returning *")).rows[0];
  assert.equal(c.owner_id, 'workspace');
  assert.equal((await db.query(`insert into events(contact_id,kind,body) values('${c.id}','Nota','Test') returning actor_id`)).rows[0].actor_id, 'workspace');
  await assert.rejects(db.query("insert into contacts(company,person) values('Invalido','')"));
 } finally { await db.close(); }
});
