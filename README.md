# Link permanente all'ultima convocazione - Assemblea Ordinaria

Questo repository gestisce un link permanente che reindirizza sempre in automatico al **PDF più recente** della convocazione per l'Assemblea Ordinaria di **ESN Modena e Reggio Emilia**.

**Link ufficiale:** [https://esn-more.github.io/assemblea-ordinaria-link/](https://esn-more.github.io/assemblea-ordinaria-link/)

## Come funziona?

Il sistema è automatizzato, non ci sono file statici da toccare:

1. Ogni **15 minuti**, parte una GitHub Action che chiama l'API di Google Drive.
2. Controlla la cartella condivisa e individua l'ID del PDF più recente (basandosi sulla **data di caricamento/modifica**).
3. Se viene trovato un nuovo file, l'Action genera al volo una nuova mini pagina HTML (con dei meta tag nell'head per invalidare la cache nei browser, visto che non dovrebbe cacheare il redirect) e lo pubblica direttamente sui server di GitHub Pages.

## Regole importanti (Google Drive)

Affinché il link non si rompa, chi gestisce la cartella su Drive deve assicurarsi che:

- La cartella deve essere impostata su **"Chiunque abbia il link"** (ruolo: _Lettore_). Se l'accesso viene limitato o reso interno all'organizzazione, l'Action fallirà e il link punterà all'ultimo file "pubblico" conosciuto.
- Lo script scarica l'ultimo PDF che trova. Bisogna assicurarsi che nella cartella ci siano **solo** le convocazioni ufficiali. Se carichi una bozza o un file con data di modifica più recente, il link punterà a quello.
- Il sistema cerca specificamente file con estensione `.pdf`. Altri formati (Word, immagini) verranno ignorati.
