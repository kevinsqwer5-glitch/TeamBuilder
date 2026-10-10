# 🍻 TeamBuilder – Trinkspiel-Edition

Kleine Web-App, die aus einer Namensliste zufällige Teams für Trinkspiele bildet.
Jedes Team bekommt einen zufälligen Namen (aus 100 Trinkspiel-Teamnamen, ohne Wiederholung)
und eine eigene Neonfarbe.

## Nutzung

`index.html` im Browser öffnen – kein Build, kein Server nötig.
Läuft auch auf dem Handy (z. B. über GitHub Pages).

1. Mitspieler eintragen (einer pro Zeile oder mit Komma/Semikolon getrennt)
2. Teilnehmer pro Team wählen
3. **Teams bilden** – mit *Neu mischen* gibt's eine neue Verteilung, *Kopieren* legt die Teams in die Zwischenablage

Geht die Rechnung nicht auf, werden übrige Spieler reihum auf die Teams verteilt
(z. B. 7 Spieler, 2er-Teams → 2 + 2 + 3), damit niemand allein dasteht.

## Dateien

- `index.html` – Oberfläche
- `css/style.css` – Party-Design
- `js/teamnames.js` – die 100 Teamnamen
- `js/app.js` – Logik (Mischen, Teams, Farben, Konfetti)
