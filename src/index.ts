import { config } from "./config.ts";
import { health, isStale, refresh, refreshInBackground, restore, snapshot } from "./cache.ts";
import { viewerUrl } from "./drive.ts";
import { unavailablePage } from "./page.ts";

// Un redirect cachato è il modo più semplice per servire una convocazione vecchia.
const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache"
} as const;

await restore();
await refresh(); // Prima richiesta servita a cache calda, non fredda.

const server = Bun.serve({
  port: config.port,

  routes: {
    "/": {
      GET: handleRedirect,
      HEAD: handleRedirect
    },
    "/health": () => {
      const report = health();
      return Response.json(report, { status: report.ok ? 200 : 503, headers: NO_STORE });
    }
  },

  fetch: () => new Response("Not Found", { status: 404, headers: NO_STORE }),

  error: (error) => {
    console.error("Errore non gestito:", error);
    return new Response("Errore interno", { status: 500, headers: NO_STORE });
  }
});

function handleRedirect(): Response {
  const latest = snapshot();

  // Cache stantia: rispondiamo subito con quello che abbiamo e aggiorniamo dopo.
  if (isStale()) refreshInBackground();

  if (!latest) {
    return new Response(unavailablePage(), {
      status: 503,
      headers: { ...NO_STORE, "Content-Type": "text/html; charset=utf-8", "Retry-After": "10" }
    });
  }

  // Response.redirect() non permette header extra: il no-store qui è essenziale,
  // altrimenti il browser ricorda il redirect e salta il server alla prossima visita.
  return new Response(null, {
    status: 302,
    headers: { ...NO_STORE, Location: viewerUrl(latest.id) }
  });
}

setInterval(refreshInBackground, config.refreshIntervalMs);

console.log(`In ascolto su http://localhost:${server.port} — refresh ogni ${config.refreshIntervalMs / 60000} min`);
