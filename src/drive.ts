import { config } from "./config.ts";

export type DrivePdf = {
  id: string;
  name: string;
  modifiedTime: string;
};

type DriveResponse = {
  files?: { id?: string; name?: string; modifiedTime?: string }[];
};

/**
 * Restituisce il PDF modificato più di recente nella cartella condivisa.
 * Nessun filtro sul nome: conta solo la data di modifica, come da requisito.
 */
export async function fetchLatestPdf(): Promise<DrivePdf | null> {
  const params = new URLSearchParams({
    q: `'${config.driveFolderId}' in parents and trashed=false and mimeType='application/pdf'`,
    orderBy: "modifiedTime desc",
    pageSize: "1",
    fields: "files(id,name,modifiedTime)",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
    key: config.driveApiKey
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    signal: AbortSignal.timeout(config.driveTimeoutMs)
  });

  if (!res.ok) {
    // Il corpo dell'errore di Google spiega quasi sempre il problema
    // (chiave scaduta, cartella non più pubblica, quota esaurita).
    throw new Error(`Drive ha risposto ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }

  const data = (await res.json()) as DriveResponse;
  const file = data.files?.[0];
  if (!file?.id) return null;

  return {
    id: file.id,
    name: file.name ?? "(senza nome)",
    modifiedTime: file.modifiedTime ?? ""
  };
}

export function viewerUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}
