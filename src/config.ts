function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Manca la variabile d'ambiente ${name}`);
  return value;
}

function numeric(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} deve essere un numero positivo, ricevuto: ${raw}`);
  }
  return parsed;
}

export const config = {
  port: numeric("PORT", 3000),
  driveApiKey: required("GDRIVE_API_KEY"),
  driveFolderId: required("GDRIVE_FOLDER_ID"),

  /** Ogni quanto il refresh periodico interroga Drive. */
  refreshIntervalMs: numeric("REFRESH_INTERVAL_MS", 15 * 60 * 1000),
  /** Oltre questa età la cache è considerata stantia e un refresh parte su richiesta. */
  staleAfterMs: numeric("STALE_AFTER_MS", 20 * 60 * 1000),
  /** Timeout della singola chiamata a Drive. */
  driveTimeoutMs: numeric("DRIVE_TIMEOUT_MS", 10_000),

  /** Ultimo ID buono, per sopravvivere ai riavvii. */
  stateFile: process.env.STATE_FILE ?? "state.json"
} as const;
