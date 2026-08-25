/**
 * Pagina mostrata solo quando non abbiamo nessun ID da servire
 * (cartella vuota, oppure Drive irraggiungibile al primo avvio).
 * Nel caso normale l'utente riceve un 302 e questa pagina non esiste.
 */
export function unavailablePage(): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="10">
  <meta name="color-scheme" content="light dark">
  <title>Convocazione Assemblea - ESN Modena e Reggio Emilia</title>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #ffffff;
      --text: #333333;
      --title: #2e3192;
      --spinner-bg: #f3f3f3;
      color-scheme: light dark;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #121212; --text: #eeeeee; --title: #ffffff; --spinner-bg: #333333; }
    }
    body {
      font-family: 'Lato', system-ui, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; padding: 20px;
      background: var(--bg); color: var(--text); text-align: center;
    }
    img { max-width: 300px; margin-bottom: 25px; }
    h1 { color: var(--title); font-size: 26px; margin-bottom: 5px; }
    .spinner {
      border: 4px solid var(--spinner-bg); border-top: 4px solid #ec008c;
      border-radius: 50%; width: 40px; height: 40px;
      animation: spin 1s linear infinite; margin: 20px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <picture>
    <source srcset="https://more.esn.it/sites/esnmodena.it/files/web-it-mode-esn-colour-white.png" media="(prefers-color-scheme: dark)">
    <img src="https://more.esn.it/sites/esnmodena.it/files/web-it-mode-esn-colour-black.png" alt="Logo ESN">
  </picture>
  <h1>Assemblea Ordinaria</h1>
  <p>Sto recuperando l'ultima convocazione&hellip;</p>
  <div class="spinner"></div>
  <p style="font-size: 14px; margin-top: 15px;">
    Questa pagina si aggiorna da sola. Se il problema persiste, avvisa il Consiglio Direttivo.
  </p>
</body>
</html>`;
}
