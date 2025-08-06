# Zum Projekt beitragen

Wir freuen uns über jede Art von Beitrag, sei es durch das Testen auf verschiedenen Plattformen, das Melden von Fehlern oder das Einreichen von Code-Verbesserungen.

## Wie du helfen kannst

### Git-Provider testen
`context-now` wurde bisher nur ausgiebig mit **GitHub** getestet. Wir suchen dringend Tester für andere Git-Plattformen wie GitLab, Bitbucket, Gitea und andere.

**Dein Workflow als Tester:**
1.  Forke das [Repository](https://github.com/GaboCapo/context-now).
2.  Installiere das Tool und verbinde es mit einem deiner Projekte, das auf einer anderen Plattform gehostet wird.
3.  Teste die Kernfunktionen:
    -   Werden lokale und Remote-Branches korrekt erkannt?
    -   Funktioniert die Synchronisation?
    -   Gibt es Probleme bei der Statusanzeige?
4.  Dokumentiere deine Ergebnisse – was funktioniert und was nicht?
5.  Erstelle einen **Pull Request** mit deinen Erkenntnissen oder melde ein **Issue**.

### Fehler melden (Issue Reports)
Wenn du auf ein Problem stößt, erstelle bitte ein [Issue](https://github.com/GaboCapo/context-now/issues) und gib dabei so viele Informationen wie möglich an:
- **Git-Provider**: GitHub, GitLab, etc.
- **Shell**: Welche Shell verwendest du (z.B. bash, zsh, fish)?
- **Fehlermeldung**: Kopiere die exakte Fehlermeldung.
- **Kontext**: Was hast du versucht zu tun, als der Fehler auftrat?
- **Schritte zur Reproduktion**: Eine schrittweise Anleitung, wie wir den Fehler nachstellen können.

### Code beitragen (Entwicklung)
Wenn du eine neue Funktion hinzufügen oder einen Fehler beheben möchtest, folge bitte diesen Schritten:

1.  **Forke und klone das Repository**:
    ```bash
    git clone https://github.com/[DEIN-BENUTZERNAME]/context-now.git
    cd context-now
    ```
2.  **Erstelle einen neuen Feature-Branch**:
    ```bash
    git checkout -b feature/meine-neue-funktion
    ```
3.  **Nimm deine Änderungen vor**:
    -   Schreibe klaren und verständlichen Code.
    -   Halte dich an den bestehenden Code-Stil.
4.  **Commite deine Änderungen**:
    Verwende eine aussagekräftige Commit-Nachricht.
    ```bash
    git commit -m "Feat: Füge Unterstützung für GitLab-Issues hinzu"
    ```
5.  **Erstelle einen Pull Request**:
    Pushe deinen Branch zu deinem Fork und erstelle einen Pull Request gegen den `main`-Branch des Original-Repositorys. Beschreibe deine Änderungen im Pull Request detailliert.
