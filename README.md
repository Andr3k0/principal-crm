# CRM per siti

CRM per PrincipalSites con un solo accesso protetto da password condivisa: nessun profilo personale e nessuna gestione di utenti nell’interfaccia.

La versione online usa una funzione Netlify ristretta alle sole operazioni CRM. La chiave amministrativa Supabase resta sul server e non viene mai inviata al browser.

## Stato della consegna

- Interfaccia funzionante e verificata in modalità demo locale.
- Codice per un accesso CRM e dati condivisi Supabase, schema SQL e autorizzazioni inclusi.
- Connettore MCP locale per Codex incluso e verificato a livello di protocollo. Collegamento al progetto reale ancora da attivare.
- Nessun progetto Supabase creato, nessun account dei soci creato, nessuna pubblicazione Netlify effettuata.
- L’AI è destinata a due funzioni: ricerca territoriale di aziende potenziali con creazione dei lead e preparazione automatica di email/messaggi personalizzati. Non invia nulla senza revisione.

## Prova immediata

Richiede Node.js 22 o successivo. Dal terminale nella cartella del progetto:

```sh
npm run dev
```

Apri http://127.0.0.1:4173 e seleziona **Esplora la demo**. Il pulsante ⇄ in basso cambia socio simulato. I dati dimostrativi restano soltanto nel browser; non sono accessi veri e non si sincronizzano fra due computer. `npm run dev` serve la demo contenuta in `public/`.

## Cosa include

| Area | Funzioni |
|---|---|
| Panoramica | Opportunità attive, valore stimato, anteprime, azioni da seguire |
| Contatti | Azienda, referente e almeno un contatto email/telefono obbligatori; settore, città, fonte, bisogno, briefing e priorità |
| Pipeline | Ricerca → primo contatto → briefing → anteprima → preventivo. L’esito è separato: In corso, Acquisto, Perso |
| Anteprime | Avvio esplicito e scadenza dopo 48 ore effettive; link all’anteprima |
| Attività | Prossima azione e scadenza per contatto, completamento, note, telefonate, email e riunioni registrate manualmente |
| Ricerca | Apertura di una ricerca web per settore e zona; salvataggio manuale delle aziende selezionate e delle fonti |
| Scrittura | Modello di primo contatto, contesto per ChatGPT, bozze condivise, Email/WhatsApp/LinkedIn |
| Storico | Autore autenticato, data, campi modificati e origine manuale/AI |
| Esportazione | CSV dei contatti filtrati, con protezione dai valori interpretati come formule |

Il CRM usa un solo profilo operativo. Le azioni sono attribuite all’utente autenticato, senza distinzione tra soci o responsabili separati.

Le condizioni nei testi sono quelle lette sul sito: **anteprima gratuita entro 48 ore**, Starter **1.350 €**, sviluppo finale in **circa due settimane**, **2 revisioni**. Le 48 ore non vengono presentate come consegna del sito finale.

## Attivare il database condiviso

1. Crea un progetto Supabase dedicato. Nessun dato dimostrativo viene trasferito automaticamente.
2. In Authentication crea un solo utente tecnico: `crm-workspace@principalsites.it`, con la password condivisa. Disabilita le nuove registrazioni pubbliche.
3. Nel SQL Editor esegui `database/001_schema.sql` una sola volta.

Solo utenti autenticati possono leggere o scrivere nel CRM. La email tecnica non viene mostrata nell’interfaccia.

Le policy RLS sono applicate a tutte le tabelle. I trigger ricavano l’autore dall’identità autenticata e impediscono di cambiare autore/data di creazione. I soci non possono modificare o cancellare lo storico e non possono creare altri soci. Gli aggiornamenti richiedono la versione letta per evitare sovrascritture involontarie. Il connettore AI mantiene gli stessi permessi.

## Pubblicare su Netlify

### Configurazione manuale obbligatoria

1. Crea un progetto Supabase vuoto.
2. Esegui `database/001_schema.sql` nel SQL Editor.
3. Recupera URL progetto e chiave pubblica `anon` da Supabase. Non usare chiavi private o server.
4. Crea un repository Git con il contenuto di questa cartella e collegalo a Netlify.
5. In Netlify imposta queste variabili di ambiente:

   - `PUBLIC_SUPABASE_URL`: URL del progetto;
   - `PUBLIC_SUPABASE_ANON_KEY`: chiave pubblica anon;

6. Imposta build command `npm run build` e publish directory `dist`.
7. Pubblica il sito e apri l’URL Netlify.
8. Accedi con la sola password condivisa.
9. Prova creazione, modifica, archiviazione e lettura dello storico da due browser diversi usando la stessa password.

La password condivisa è la password dell’utente tecnico Supabase Auth; cambiala nella gestione Authentication.

Il progetto è predisposto per Netlify, senza dipendenze frontend a runtime.

1. Carica il progetto in un repository e collegalo a Netlify.
2. Configura le variabili di build:
   - `SUPABASE_URL`: `https://ID-PROGETTO.supabase.co`
   - `SUPABASE_ANON_KEY`: chiave pubblica publishable o anon del progetto.
3. Build command: `npm run build`. Publish directory: `dist`. Il file `netlify.toml` contiene già questi valori e gli header di protezione.
4. Esegui il deploy. Con entrambe le variabili presenti si mostra il login vero; senza variabili la build resta una demo esplicitamente indicata.
5. Prova i due accessi su due browser separati: crea un contatto con Andrea, aprilo con Marco, aggiungi una nota e verifica lo storico. I dati si aggiornano automaticamente ogni 30 secondi nelle viste non in modifica, oppure con ↻.

Per una build locale configurata, copia `.env.example` in `.env`, inserisci soltanto URL e chiave pubblica e avvia:

```sh
node --env-file=.env scripts/build.mjs
```

Per il caricamento manuale su Netlify usa **solo il contenuto di `dist`**, generato con le variabili vere. Lo ZIP sorgente contiene SQL e strumenti locali e non va usato come cartella pubblica.

## Usare l’AI con Plus

**Dal browser del CRM:** scegli un contatto in Assistente, prepara il contesto, copialo in ChatGPT e salva nel CRM la risposta da revisionare. Il pulsante “Modello primo contatto” genera un testo precompilato, non una risposta AI. Non viene inviata alcuna email o messaggio.

**Da Codex, dopo aver configurato il connettore:** puoi chiedere, ad esempio, “leggi i contatti da seguire e proponi tre priorità”, “salva una bozza per Studio Rossi” oppure “registra questa ricerca e assegnala a Marco”. Il connettore legge e aggiorna il database, mentre l’elaborazione AI avviene nella tua sessione Codex con il piano e i limiti disponibili. Non avvia chiamate alle API OpenAI.

Configurazione locale per ciascun socio:

1. Nel terminale della cartella del progetto avvia `node scripts/crm-login.mjs`.
2. Inserisci URL Supabase, chiave pubblica e le tue credenziali CRM. La password non viene salvata. La sessione viene conservata nel file privato `.crm-session.json` con permessi 0600, escluso da Git. Non condividere questo file e non caricarlo su Netlify.
3. In Codex → Impostazioni → MCP servers, aggiungi un server STDIO chiamato `principal-crm`: comando `node`, argomento il **percorso assoluto** di `scripts/crm-mcp.mjs`. Riavvia il server. Puoi usare anche il percorso assoluto dell’eseguibile Node se l’app non lo trova.
4. Il server espone sei strumenti: elenco, scheda, creazione, aggiornamento, nota e bozza. Le scritture risultano attribuite al tuo utente con origine AI.

Esempio di configurazione Codex, da adattare al percorso locale:

```toml
[mcp_servers.principal-crm]
command = "node"
args = ["/PERCORSO/ASSOLUTO/principal-crm/scripts/crm-mcp.mjs"]
```

Per rimuovere la sessione locale: `node scripts/crm-login.mjs --logout`, poi arresta/riavvia il server MCP. Per revocare sessioni remote usa la gestione Auth Supabase.

Il connettore locale funziona nelle superfici Codex che leggono la configurazione MCP; non collega automaticamente ChatGPT web o lo smartphone. Un assistente incorporato direttamente nel sito richiederebbe un’integrazione separata con API e relativo budget.

Riferimenti ufficiali: [autenticazione Codex e distinzione API/abbonamento](https://learn.chatgpt.com/docs/auth), [server MCP in Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Supabase Auth](https://supabase.com/docs/guides/auth/passwords), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verifiche eseguite

```sh
npm ci
npm test
npm run build
```

Sei test automatici passati: validazione, protezione HTML/CSV, calcolo 48 ore, correttezza dei modelli, permessi/attribuzione/concorrenza in PostgreSQL PGlite con identità simulate e protocollo MCP. Test browser della demo: creazione scheda, attribuzione Andrea/Marco, generazione e salvataggio bozza, archiviazione. Controllato il layout desktop e l’assenza di overflow della pagina a 390 px.

La verifica PGlite non sostituisce la prova finale di Supabase Auth e delle due sessioni reali dopo il deploy. Il connettore non è ancora stato collegato a credenziali reali.

## Limiti di questa prima versione

Un’azione pianificata per contatto; aggiornamento periodico anziché collaborazione in tempo reale; email e messaggi registrati manualmente; nessun invio automatico, sincronizzazione caselle email, import CSV, allegati o generazione di preventivi PDF. Gli importi sono stime delle opportunità, non contabilità o fatturazione. La ricerca apre il motore esterno; l’arricchimento automatico dei lead non è attivo.

L’archiviazione conserva i record. Il ripristino è amministrativo. Per ripristinare dal SQL Editor, usa una transazione con l’UUID del socio amministratore impostato come autore:

```sql
begin;
select set_config('request.jwt.claim.sub','UUID_REALE_DEL_SOCIO',true);
update public.contacts set archived_at=null where id='UUID_CONTATTO';
commit;
```

Lo storico mostra i campi cambiati, senza una copia integrale dei valori precedenti. La gestione degli account e dei recuperi password avviene per ora dalla console Supabase.
