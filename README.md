# Link permanente all'ultima convocazione per l'Assemblea Ordinaria

Questo repository gestisce un link permanente che reindirizza sempre in automatico al **PDF più recente** della convocazione per l'Assemblea Ordinaria (ESN Modena e Reggio Emilia).

**Link:** [https://esn-more.github.io/assemblea-ordinaria-link/](https://esn-more.github.io/assemblea-ordinaria-link/)

## Spiegazione

Il sistema è automatico:

1. Ogni **15 minuti**, una GitHub Action si collega in background a Google Drive.
2. Controlla la cartella condivisa delle convocazioni e individua l'ultimo PDF caricato o modificato.
3. Se trova un file nuovo, aggiorna in automatico il file `index.html` del sito web (su GitHub Pages) creando un redirect al nuovo documento.

## Robe importanti per Google Drive

Affinché il sistema continui a funzionare in futuro, chi gestisce la cartella Drive deve ricordare due cose:

- **Condivisione pubblica:** La cartella Google Drive delle convocazioni deve sempre mantenere l'accesso impostato su _"Chiunque abbia il link"_ (con ruolo: Lettore). Se diventa privata, la GitHub Action non troverà i file.
- **Pulizia dei file:** Inserisci in quella specifica cartella _solo_ i PDF ufficiali delle convocazioni, poiché il sistema catturerà sempre l'ultimo file in ordine cronologico.
