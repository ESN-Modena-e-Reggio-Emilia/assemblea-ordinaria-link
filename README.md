# assemblea-link-server

Link permanente all'ultima convocazione dell'Assemblea Ordinaria di **ESN Modena e Reggio Emilia**.

Un solo processo Bun: interroga Google Drive, tiene in cache l'ID del PDF modificato più di recente
e risponde a `GET /` con un `302` verso quel file. Niente GitHub Actions, niente GitHub Pages,
niente file statici da rigenerare.

## Avvio

```bash
bun install
cp .env.example .env   # compila GDRIVE_API_KEY e GDRIVE_FOLDER_ID
bun start              # oppure: bun run dev  (con --watch)
```

## Variabili d'ambiente

Bun carica `.env` da solo, non serve dotenv.

| Variabile | Obbligatoria | Default | Cosa fa |
| --- | --- | --- | --- |
| `GDRIVE_API_KEY` | sì | — | Chiave API Google con Drive API abilitata |
| `GDRIVE_FOLDER_ID` | sì | — | Cartella Drive delle convocazioni |
| `PORT` | no | `3000` | Porta di ascolto (nginx sta davanti) |
| `REFRESH_INTERVAL_MS` | no | `900000` (15 min) | Frequenza del refresh periodico |
| `STALE_AFTER_MS` | no | `1200000` (20 min) | Oltre questa età una richiesta fa scattare un refresh |
| `DRIVE_TIMEOUT_MS` | no | `10000` | Timeout della chiamata a Drive |
| `STATE_FILE` | no | `state.json` | Dove salvare l'ultimo ID buono |

## Endpoint

- `GET /` → `302` verso `https://drive.google.com/file/d/<ID>/view`, con `Cache-Control: no-store`.
  Se non c'è nessun ID disponibile (cartella vuota o Drive down al primo avvio) → `503` con pagina
  ESN che si ricarica da sola ogni 10 secondi.
- `GET /health` → JSON con ID e nome del file corrente, età della cache, errori recenti.
  Risponde `503` dopo 3 fallimenti consecutivi verso Drive: è l'endpoint da dare all'uptime monitor.

## Comportamento della cache

- Al boot: ripristina `state.json`, poi fa un refresh **prima** di aprire la porta. La prima
  richiesta trova già la cache calda.
- Refresh periodico ogni 15 minuti.
- Se una richiesta arriva con cache più vecchia di 20 minuti, il refresh parte in background e
  l'utente riceve comunque subito il redirect: non aspetta mai Google.
- **Stale-while-error**: se Drive fallisce, l'ultimo ID buono continua a essere servito. Il link non
  si rompe mai per un problema temporaneo di Google, e `state.json` fa sopravvivere l'ID ai riavvii.
- Refresh concorrenti condividono la stessa chiamata a Drive (single-flight).

## Deploy con PM2

```bash
bun install --production
pm2 start ecosystem.config.cjs
pm2 save
```

`ecosystem.config.cjs` usa `interpreter: "bun"`, quindi Bun deve essere nel `PATH` dell'utente PM2
(se `pm2` non lo trova, metti il percorso assoluto in `interpreter`).

Reverse proxy nginx:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Log: `pm2 logs assemblea-link`.

## Regole per chi gestisce la cartella Drive

- La cartella deve restare condivisa come **"Chiunque abbia il link"** (ruolo: _Visualizzatore_).
  Con una API key non c'è altro modo di leggerla: se l'accesso viene ristretto, il servizio continua
  a servire l'ultimo link conosciuto ma non vedrà più i nuovi caricamenti. In quel caso `/health`
  va in 503.
- Vale **solo** la data di ultima modifica: nessun controllo sul nome del file. Se carichi una bozza,
  il link punta alla bozza. Nella cartella devono esserci solo le convocazioni ufficiali.
- Vengono considerati solo i file `application/pdf`.
