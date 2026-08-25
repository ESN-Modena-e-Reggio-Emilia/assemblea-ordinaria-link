# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Un link permanente che punta sempre all'ultima convocazione dell'Assemblea Ordinaria di ESN Modena
e Reggio Emilia (PDF su Google Drive). Il link viene messo in fondo a https://more.esn.it/ e non
deve mai cambiare.

**`assemblea-link-server/` è l'implementazione attuale e l'unica su cui lavorare.** Un singolo
processo Bun sulla VPS, dietro nginx, gestito da PM2. Vedi il suo README per env, endpoint e deploy.

### Codice legacy — da cestinare, non modificare

- `assemblea-ordinaria-link/` — vecchia GitHub Action che generava una GitHub Page statica. Partiva
  in modo inaffidabile: è il motivo per cui il sistema è stato riscritto.
- `update-link-assemblea-bun/` — daemon che girava sulla VPS solo per forzare via `workflow_dispatch`
  la Action di cui sopra, più un commit "keepalive" per impedire a GitHub di disattivare il cron.

Entrambe restano solo come reference storica. Non aggiungere feature lì e non riportare in vita il
percorso GitHub Pages: il nuovo servizio lo sostituisce interamente.

## Architettura del servizio

`src/config.ts` (env validate al boot) → `src/drive.ts` (una chiamata a Drive v3) →
`src/cache.ts` (stato + refresh) → `src/index.ts` (Bun.serve, due route).

Il flusso: la cache tiene l'ID del PDF con `modifiedTime` più recente nella cartella; `GET /`
risponde con un `302` verso `https://drive.google.com/file/d/<ID>/view` senza mai attendere Google.

Invarianti da non rompere:

- **Nessun filtro sul nome del file.** Conta solo `orderBy=modifiedTime desc` fra i `application/pdf`.
  È un requisito esplicito, non una svista.
- **La richiesta non blocca mai su Drive.** Cache stantia ⇒ refresh in background e si serve
  comunque il valore corrente. Il boot fa un refresh prima di `Bun.serve` proprio per questo.
- **Stale-while-error.** `refresh()` non lancia mai: su errore si continua a servire l'ultimo ID
  buono, persistito in `state.json`. Rompere questo significa che un blip di Google rompe il link.
- **`Cache-Control: no-store` su ogni risposta,** redirect incluso. `Response.redirect()` non accetta
  header extra: per questo il 302 è costruito a mano.
- `/health` va in 503 dopo 3 fallimenti consecutivi mentre `/` continua a funzionare: è la
  distinzione fra "il servizio è degradato" e "il servizio è giù".

## Convenzioni

- Bun ovunque (`bun run`, `bun install`, `Bun.serve`, `Bun.file`/`Bun.write`). Nessuna dipendenza
  runtime; niente express, niente dotenv — Bun carica `.env` da solo.
- Log, commenti ed errori in italiano.
- Palette ESN nella pagina di fallback: Lato, `#2e3192` blu, `#00aeef` ciano, `#ec008c` magenta,
  con supporto `prefers-color-scheme`.

## Comandi

```bash
cd assemblea-link-server
bun install
bun start          # produzione
bun run dev        # con --watch
bun run typecheck  # tsc --noEmit
curl -si localhost:3000/ | head -4     # verifica il 302
curl -s localhost:3000/health          # stato cache ed errori
```

Non esiste una test suite. Per verificare un cambiamento: avvia il server con `PORT` e `STATE_FILE`
alternativi e controlla i due `curl` sopra, incluso il caso di errore (`GDRIVE_API_KEY` sbagliata
con uno `state.json` valido deve comunque rispondere 302).
