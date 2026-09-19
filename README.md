# Vermögen

Eine kleine PWA zur persönlichen Vermögensaufstellung: einmal im Monat die
Stände der eigenen Positionen eintragen und sehen, wie sich das Vermögen
entwickelt.

**Alle Daten bleiben auf dem Gerät.** Es gibt kein Backend, keine Anmeldung
und keine Übertragung nach außen — gespeichert wird ausschließlich im
`localStorage` des Browsers. Entsprechend gilt: Wer die App deinstalliert
oder die Website-Daten löscht, verliert die Eingaben. Vor einer
Neuinstallation also immer erst ein Backup exportieren.

Läuft über GitHub Pages aus `main`: https://freshglitch4j.github.io/vermoegen/

## Funktionen

- **Übersicht** – Monatsstand mit Vergleichsspalte zum Vormonat, Ringdiagramm
  der Aufteilung, aufklappbare Kategorien, Wischen zwischen Monaten
- **Erfassen** – Eingabemaske mit Vorbelegung aus dem letzten Monat
- **Entwicklung** – Verlaufslinie und gestapelte Zusammensetzung,
  Prognosemonate gestrichelt
- **Einstellungen** – Kategorienverwaltung mit Ziehen zum Sortieren,
  Hell-/Dunkelmodus, Beträge verbergen, Backup als JSON,
  Export und Import über CSV, Testdaten laden

Zahlen durchgehend im österreichischen Format mit Komma als Dezimaltrennzeichen.

## Technik

Vanilla JavaScript, kein Framework, **kein Build-Schritt**. Die Dateien im
Repository-Wurzelverzeichnis sind genau das, was ausgeliefert wird.

| Datei | Zweck |
|---|---|
| `index.html` | Gerüst, Tableiste, Theme-Bootstrap vor dem ersten Rendern |
| `app.js` | gesamte Anwendung (Router, Datenmodell, Rendering, Diagramme) |
| `app.css` | Design-System, Farbvariablen für Hell und Dunkel |
| `sw.js` | Service Worker, macht die App offline nutzbar |
| `manifest.webmanifest` | Installierbarkeit, Icons, Farben der System-UI |
| `inter.woff2` | Schrift, lokal eingebunden |
| `icon-*.png` | App-Icons inklusive maskable und Apple-Touch |

Hash-Router ohne History-Einträge:

```
#/                          Übersicht
#/entwicklung               Verlauf
#/erfassen/YYYY-MM          Eingabe für einen Monat
#/einstellungen             Einstellungen
#/einstellungen/kategorien  Kategorienverwaltung
```

## Datenmodell

Gespeichert unter dem Schlüssel `vermoegen.v1`:

```js
{
  v: 1,
  nodes: [{ id, name, parent, order, color, liability, excluded, archived }],
  months: { "2026-08": { forecast: Boolean, values: { nodeId: Zahl }, saved } },
  settings: { hide, theme: "system"|"light"|"dark", lastBackup }
}
```

- `nodes` bildet bis zu drei Ebenen ab; Elternsummen werden aus den Kindern
  berechnet, nicht gespeichert
- `liability` markiert Schulden (z. B. einen Kredit) — sie werden **positiv
  gespeichert** und erst beim Rechnen abgezogen
- `excluded` zählt nicht zum Gesamtvermögen
- `forecast` setzt sich beim Speichern automatisch: vor dem Monatsletzten
  gilt der Eintrag als Prognose

Weitere Schlüssel: `vermoegen.vorImport` (Rückgängig-Stand des letzten
Imports), `vermoegen.open` (aufgeklappte Kategorien).

## Neue Version veröffentlichen

**Bei jeder Änderung beide Stellen hochzählen:**

1. `APP_VERSION` in `app.js`
2. `CACHE` in `sw.js`

Wird nur die eine geändert, liefert der Service Worker weiter die alte
Fassung aus dem Cache und das Handy sieht das Update nie. Der Service Worker
cacht auch `index.html` und `manifest.webmanifest`, ein Bump ist also selbst
dann nötig, wenn gar kein JavaScript berührt wurde.

Nach dem Push nach `main` dauert GitHub Pages ein bis zwei Minuten. Zum
Prüfen im normalen Browsertab die URL mit angehängtem `?v=2` aufrufen, das
umgeht den Cache zuverlässig. Die installierte App lädt sich nach einem
Update einmal automatisch neu.

## Entwicklung und Test

Kein Toolchain nötig — Dateien bearbeiten, lokal ausliefern:

```bash
python3 -m http.server 8099
```

Getestet wird mit Playwright im Zuschnitt des Zielgeräts (Samsung Galaxy A55,
Chrome): Viewport 412×915, `isMobile`, `hasTouch`, Sprache `de-AT`.
Abnahmekriterium: keine Fehler in der Konsole — und die Screenshots wirklich
ansehen, nicht nur auf grüne Zusicherungen schauen.

Wischgesten lassen sich mit Playwright allein nicht auslösen, die brauchen
`Input.dispatchTouchEvent` über CDP. Testdaten liefert „Testdaten laden“ in
den Einstellungen, das erspart das Eintippen.

## Fallstricke

Punkte, die beim Weiterbauen leicht Schaden anrichten:

- **Elternwerte.** `val()` bildet die Summe der Kinder, sobald *mindestens
  ein* Kind einen Wert hat. Nur wenn kein Kind einen Wert hat, gilt der
  eigene gespeicherte Wert. Das ist Absicht, damit sich alte Monate
  importieren lassen, für die es nur Kategoriesummen gibt.
- **Schulden.** Positiv gespeichert, negiert erst in der Berechnung. Beim
  Import deshalb `Math.abs` anwenden.
- **Vergleichsmonat.** Das ist der nächstältere vorhandene Eintrag, nicht
  zwingend der Kalendervormonat. Relevant, wenn ein Monat fehlt.
- **Archivierte Positionen.** Ihre alten Werte bleiben erhalten und werden
  beim Speichern eines Monats mit übernommen, obwohl sie im Formular nicht
  mehr auftauchen.
- **Diagrammfarben.** Gehören in die CSS-Klassen (`k-grid`, `k-line`,
  `k-dot`, `k-veil`). Feste Farben in SVG-Attributen brechen den Dunkelmodus.
- **Kategoriefarben.** `PALETTE` enthält Paare aus heller und dunkler Stufe,
  `cc()` wählt je nach Modus. Die Palette ist auf Farbfehlsichtigkeit
  geprüft — nicht durch beliebige Farben ersetzen.
- **Import-Rückgängig.** Liegt unter `vermoegen.vorImport` und wird beim
  nächsten Import überschrieben. Es gibt nur eine Stufe.
- **Farbe der System-Statusleiste.** Kommt unter Android aus `theme-color`.
  Die Farbe steht deklarativ als zwei `<meta>`-Elemente je
  `prefers-color-scheme` in `index.html`, weil Chrome sie beim ersten
  Rendern auswertet und spätere Änderungen per JavaScript im installierten
  Betrieb nicht zuverlässig übernimmt. Wer die Farben ändert, muss sie an
  drei Stellen angleichen: beide Metas, das Boot-Skript in `index.html` und
  `applyTheme()` in `app.js`.

## Ideen für später

Notizfeld pro Monat · Zielwert mit Fortschrittsanzeige · Jahresvergleich ·
Erinnerung am Monatsende · Backup-Erinnerung nach X Monaten · Aufteilung
nach Risiko statt nach Kategorie
