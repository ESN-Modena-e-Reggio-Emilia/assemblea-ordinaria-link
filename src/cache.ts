import { config } from "./config.ts";
import { fetchLatestPdf, type DrivePdf } from "./drive.ts";

type Snapshot = DrivePdf & { fetchedAt: number };

let current: Snapshot | null = null;
let inFlight: Promise<void> | null = null;
let lastError: { message: string; at: number } | null = null;
let consecutiveFailures = 0;

export function snapshot(): Snapshot | null {
  return current;
}

export function ageMs(): number | null {
  // fetchedAt === 0 identifica uno stato ripristinato da disco: non sappiamo quanto sia vecchio.
  if (!current || current.fetchedAt === 0) return null;
  return Date.now() - current.fetchedAt;
}

export function isStale(): boolean {
  const age = ageMs();
  return age === null || age > config.staleAfterMs;
}

/** Oltre questa soglia il problema con Drive non è più transitorio: /health deve fallire. */
const FAILURE_ALERT_THRESHOLD = 3;

export function health() {
  const age = ageMs();
  return {
    /** false => il monitoraggio deve svegliare qualcuno. */
    ok: current !== null && consecutiveFailures < FAILURE_ALERT_THRESHOLD,
    /** true => stiamo servendo un link valido, anche se Drive è irraggiungibile. */
    serving: current !== null,
    fileId: current?.id ?? null,
    fileName: current?.name ?? null,
    modifiedTime: current?.modifiedTime ?? null,
    fromDisk: current !== null && current.fetchedAt === 0,
    ageSeconds: age === null ? null : Math.round(age / 1000),
    stale: isStale(),
    consecutiveFailures,
    lastError
  };
}

async function load(): Promise<void> {
  const latest = await fetchLatestPdf();

  if (!latest) {
    // Cartella vuota: non è un errore di rete, ma non tocchiamo l'ultimo ID buono.
    throw new Error("Nessun PDF trovato nella cartella Drive");
  }

  const changed = latest.id !== current?.id;
  current = { ...latest, fetchedAt: Date.now() };
  consecutiveFailures = 0;
  lastError = null;

  if (changed) {
    console.log(`Nuova convocazione: ${latest.name} (${latest.id}, modificato ${latest.modifiedTime})`);
    await persist();
  }
}

/**
 * Aggiorna la cache. Chiamate concorrenti condividono la stessa richiesta a Drive.
 * Non lancia mai: in caso di errore la cache resta com'è (stale-while-error).
 */
export function refresh(): Promise<void> {
  if (inFlight) return inFlight;

  inFlight = load()
    .catch((error: unknown) => {
      consecutiveFailures++;
      const message = error instanceof Error ? error.message : String(error);
      lastError = { message, at: Date.now() };
      console.error(`Refresh fallito (${consecutiveFailures} di fila): ${message}`);
      if (current) console.error(`Continuo a servire l'ultimo ID buono: ${current.id}`);
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Refresh in background: l'utente non aspetta mai la risposta di Drive. */
export function refreshInBackground(): void {
  void refresh();
}

async function persist(): Promise<void> {
  if (!current) return;
  try {
    await Bun.write(config.stateFile, JSON.stringify(current, null, 2));
  } catch (error) {
    console.error("Impossibile scrivere lo state file:", error);
  }
}

/** Recupera l'ultimo ID buono da disco, così un riavvio non parte a cache fredda. */
export async function restore(): Promise<void> {
  try {
    const file = Bun.file(config.stateFile);
    if (!(await file.exists())) return;

    const saved = (await file.json()) as Partial<Snapshot>;
    if (!saved.id) return;

    current = {
      id: saved.id,
      name: saved.name ?? "(senza nome)",
      modifiedTime: saved.modifiedTime ?? "",
      // Marcata come vecchia di proposito: il primo refresh la rimpiazza subito.
      fetchedAt: 0
    };
    console.log(`State file ripristinato: ${current.id}`);
  } catch (error) {
    console.error("State file illeggibile, lo ignoro:", error);
  }
}
