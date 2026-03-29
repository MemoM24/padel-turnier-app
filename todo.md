# Padel Turnier App – TODO

## Setup & Konfiguration
- [x] Theme-Farben (Grün-Palette) in theme.config.js konfigurieren
- [x] App-Logo generieren und Assets setzen
- [x] app.config.ts mit App-Name aktualisieren
- [x] Typen und Interfaces definieren (Tournament, Player, Match, Round)
- [x] AsyncStorage-Utilities erstellen
- [x] i18n-System (DE/EN) implementieren
- [x] Turnier-Kontext (TournamentContext) erstellen

## Navigation
- [x] Stack-Navigation für Wizard-Flow einrichten
- [x] Tab-Navigation für Matches/Standings entfernen (eigene Tab-Bar)
- [x] Icon-Mappings in icon-symbol.tsx ergänzen

## Screens
- [x] HomeScreen mit Turnier-Historie
- [x] FirebaseConfigScreen
- [x] TournamentTypeScreen (Wizard Schritt 1)
- [x] TournamentSettingsScreen (Wizard Schritt 2)
- [x] PlayersScreen (Wizard Schritt 3)
- [x] SummaryScreen (Wizard Schritt 4)
- [x] MatchesScreen (Admin: Spielplan)
- [x] StandingsScreen (Admin: Tabelle, integriert in MatchesScreen)
- [x] JoinScreen

## Komponenten
- [x] AppHeader (Sticky Header mit Zurück-Button, Logo, Titel)
- [x] Avatar-Komponente (8 Farben, Name-Hash)
- [x] StepIndicator (4 Schritte)
- [x] MatchCard
- [x] ScoreModal (Bottom Sheet)
- [x] TimerOverlay (Vollbild)

## Turnierlogik
- [x] Americano-Algorithmus (Round-Robin)
- [x] Mexicano-Algorithmus (nach Punktestand)
- [x] Score-Berechnung (Punkte, Spiele, Ø)
- [x] Tabellen-Sortierung (Punkte DESC → Spiele DESC)
- [x] Runden-Generierung

## Persistenz
- [x] AsyncStorage: Turnier-Historie (max 20)
- [x] AsyncStorage: Gespeicherte Spieler
- [x] AsyncStorage: Firebase-Config
- [x] AsyncStorage: Turnier per ID laden

## Features
- [x] DE/EN Sprachumschaltung
- [x] Timer-Modus (Vollbild-Timer)
- [x] Turnier beenden (als finished markieren)
- [ ] QR-Code-Generierung (react-native-qrcode-svg)
- [ ] Firebase Live-Sync (optional)

## PDL1 Branding Integration
- [x] PDL1-Logo als App-Icon (icon.png, splash-icon.png, favicon.png, android-icon-foreground.png)
- [x] App-Name auf "PDL1" aktualisieren
- [x] Header-Logo auf PDL1 aktualisieren
- [x] Splash-Screen-Hintergrundfarbe auf Schwarz anpassen

## Fehlende Features aus Spezifikation v2
- [ ] Turniername-Eingabe im Wizard (Schritt 1 oder Zusammenfassung)
- [ ] QR-Code-Modal (Bottom Sheet mit QR-Code + URL kopieren)
- [ ] QR-Code-Paket installieren (react-native-qrcode-svg)
- [ ] Score-Modal: Grid 0–9 + "10+" Zellen (6×2 Layout)
- [ ] Score-Modal: Ausgewählte Zahl grün markiert
- [ ] BYE-Box: gelber Hintergrund für aussetzende Spieler
- [ ] Timer: Warnung bei 3 Min (gelb), Danger bei 1 Min (rot + Blinken)
- [ ] Timer: Fortschrittsbalken
- [ ] Viewer-Screen (screen-viewer): Live Spielplan + Tabelle per Firebase
- [ ] Firebase Live-Sync: Turnierdaten unter tournaments/{id}
- [ ] Firebase Live-Sync: Joiner-Genehmigung (pending/approved/rejected)
- [ ] Pending-Bereich im Spieler-Screen für Admin
- [ ] Mini-Avatare in der Turnier-Historie
- [ ] Live-Badge / Beendet-Badge in der Historie
- [ ] Turnier fortsetzen bei Klick auf History-Karte

## Intro-Animation (Netflix-Stil)
- [x] IntroScreen: schwarzer Hintergrund, PDL1-Logo erscheint aus Mitte (Scale-In + Fade-In)
- [x] IntroScreen: Logo pulsiert einmal (atmet ein/aus, Scale 1.0→1.08→1.0)
- [x] IntroScreen: Logo verblasst sanft (Fade-Out) nach ~2.5 Sek.
- [x] IntroScreen in Root-Layout als Overlay integrieren

## Safe Area Fix
- [x] AppHeader: paddingTop korrekt auf insets.top setzen (kein fester Wert)
- [x] HomeScreen-Header: paddingTop korrekt auf insets.top setzen
- [x] Alle Screens mit eigenem Header prüfen und Safe Area sicherstellen

## Padelmix-Verbesserungen
- [x] Score-Modal: Zahlen-Grid 00 bis max (z.B. 24) passend zur Turniereinstellung
- [x] Score-Modal: Automatische Gegenpunkt-Berechnung (Auswahl 15 → Gegner = max-15)
- [x] Score-Modal: "Benutzerdefinierte Punktzahl eingeben" Option
- [x] Spielplan-Screen: Runden-Tabs horizontal scrollbar (1, 2, 3...)
- [x] Spielplan-Screen: Spieler links/rechts, Score-Buttons in der Mitte (Padelmix-Layout)
- [x] Spielplan-Screen: "Pausierende Spieler" Sektion unten
- [x] Zusammenfassung: Detaillierte Turnierbeschreibung (Spielmodus, Regeln, Runden, Matches, Dauer)

## Runden-Navigation
- [x] Runden-Tabs klickbar: vergangene Runden als Read-only anzeigen
- [x] Aktuelle Runde bleibt editierbar, vergangene nur lesbar
- [x] Gespeicherte Scores in vergangenen Runden korrekt anzeigen

## Live-Viewer (QR-Code ohne App)
- [x] Backend: POST /api/tournament – Turnierdaten speichern/aktualisieren (tRPC tournament.upsert)
- [x] Backend: GET /api/tournament/:id – Turnierdaten abrufen (tRPC tournament.get)
- [x] Viewer-Webseite: Tabelle + alle Runden-Ergebnisse (Read-only, kein Login)
- [x] App: Turnier beim Speichern automatisch auf Server hochladen (non-blocking sync)
- [x] QR-Code zeigt Viewer-URL (öffentlich im Browser öffenbar)

## Verbesserungen v3 (Screenshots)
- [ ] Logo freigestellt: weißen Rahmen im IntroScreen entfernen (Logo direkt auf Schwarz)
- [x] Viewer-URL "Not Found" Fix: viewer.html in _core/ kopiert, Route korrekt registriert
- [x] Viewer: Auto-Refresh alle 30 Sekunden
- [x] Spieler-Input: Enter/Done-Taste fügt Spieler direkt hinzu und fokussiert nächstes Feld
- [x] Court-Icons: SVG-Court-Grafik bei Court-Auswahl in Schritt 2 (Einstellungen)
- [x] Grüner Plus-Button oben rechts im Spielplan-Screen (Join-QR öffnen)
- [x] Spieler-Join per QR: separater Join-QR-Code (nicht Viewer-QR), Browser-Formular
- [x] Admin-Bestätigung: Pending-Liste für beitretende Spieler (Ja/Nein) mit Echtzeit-Polling

## Verbesserungen v4
- [ ] Join-QR-Button: nur im Spieler-Auswahl-Screen anzeigen, nicht im laufenden Match-Screen
- [ ] Turnier-Historie: Wischen nach links/rechts zum Löschen mit Bestätigungsdialog
- [x] Sprachumschalter: Flaggen-Emoji statt DE/EN Text (🇩🇪 / 🇬🇧)
- [x] Intro-Logo: Weiße Logo-Version (pdl1_logo_white.png) für schwarzen Intro-Hintergrund
- [x] Home-Screen: Zahnrad/Firebase-Button entfernen, nur Sprachflagge im Header rechts

## Onboarding v1 (Kontextuelle Tooltips)
- [x] TooltipOverlay-Komponente: Zentrierte Bubble mit Animations, Weiter/Überspringen-Buttons
- [x] OnboardingContext: AsyncStorage-Flag ob erste Nutzung, pro Screen welche Tooltips gezeigt wurden
- [x] Home-Screen Tooltip: Willkommen + Turnier starten + Historie + Sprache
- [x] Turnier-Typ Tooltip: Americano, Mexicano Erklärung
- [x] Spieler-Screen Tooltip: Spieler eingeben + gespeicherte Spieler + QR einladen
- [x] Match-Screen Tooltip: Ergebnis eintragen + Tabelle + QR-Live-Ansicht + Timer
- [x] Sprachbutton: Schwarzes (DE) / Blaues (EN) Kreis-Badge statt Flaggen-Emoji – funktioniert auf allen Plattformen

## Verbesserungen v5
- [x] Sprachbutton: SVG-Flaggen (DE/GB) via FlagIcon-Komponente – funktioniert auf allen Plattformen
- [ ] Home-Tab: Funktion definieren (später Login/Statistiken)
- [x] Match-Screen: + Button nach letzter Runde zum Hinzufügen einer Extra-Runde (zufällige Auslosung)
- [x] Match-Screen: Finalrunde-Button – Paarungen nach Tabelle (1.+3. vs 2.+4., 5.+7. vs 6.+8. usw.)
- [x] QR-Code Live-Ansicht: viewer.html wird jetzt beim Build nach dist/ kopiert
- [x] QR-Code Spieler-Join: /join Route hinzugefügt, leitet auf /view?join=1 weiter

## Verbesserungen v6
- [x] Sprachumschaltung: useT() Hook ersetzt statisches t() – alle Komponenten rendern bei Sprachwechsel neu
- [x] Bug: Alert.prompt crash beim Hinzufügen von Courts – durch inline TextInput mit ✓/✕ Buttons ersetzt

## Verbesserungen v7 – Spielmodi
- [x] Neuer Spielmodus: Americano (Gesamtpunkte bis X) – wie bisher
- [x] Neuer Spielmodus: Klassisch (Sätze bis 6, Tiebreak bei 6:6 bis 7, 3. Satz bei 1:1 Sätzen)
- [x] Neuer Spielmodus: Super-Tiebreak (1 Satz bis X Punkte, Standard 10)
- [x] Ergebniseingabe: Satz-Eingabe (1. Satz, 2. Satz, 3. Satz ausgegraut bis nötig) für Klassisch
- [x] Tabellen-Berechnung: Satzgewinn vs. Punktegewinn je nach Modus

## Gruppen-KO Modus v1
- [x] Typen: Team-Interface (id, name, player1, player2), Group-Interface (id, name, teams, matches, court)
- [x] Typen: KOBracket-Interface (rounds: KORound[], matches: KOMatch[])
- [x] Spieler-Screen: Team-Eingabe-Modus für Gruppen-KO (2 Spieler pro Team, Teamname optional)
- [x] Algorithmus: Gruppen-Bildung (min. 3 Teams/Gruppe, nach Spieleranzahl + Courts)
- [x] Algorithmus: Round-Robin innerhalb Gruppe (jedes Team gegen jedes andere, fester Court)
- [x] Algorithmus: KO-Bracket aus Gruppensieger/Zweiten (Achtelfinale/Viertelfinale/Halbfinale/Finale)
- [x] Match-Screen: Gruppen-Tab-Ansicht (Gruppe A, B, C...) mit Gruppenstand
- [x] Match-Screen: KO-Bracket-Ansicht als Turnierbaum (visuell)
- [x] Match-Screen: Automatischer Übergang Gruppenphase → KO-Phase

## Verbesserungen v8
- [x] Einstellungen: "Punkte oder Zeit" als erste Karte anzeigen
- [x] Einstellungen: "Punkte pro Runde" ausblenden wenn Zeit-Modus gewählt

## Verbesserungen v9 – Punktesystem & Paarungen
- [ ] Satz-Ergebnis-Eingabe: Playtomic-Stil (Satz 1, Satz 2, Satz 3 mit automatischer Gewinnererkennung)
- [ ] Punktevergabe: +3 bei Sieg, +1 bei Unentschieden (2 Sätze gespielt, 3. nicht beendet, Punktgleichheit)
- [ ] Paarungsalgorithmus: Max. 2 aufeinanderfolgende Spiele pro Team

## Verbesserungen v10 – Swipe/Edit/KO-Sets
- [x] Swipe-to-Delete für Turnierhistorie (Swipeable mit rotem Löschen-Button + Bestätigungsdialog)
- [x] Nachträgliche Bearbeitung von Gruppenspiel-Ergebnissen (✏️-Icon, Modal mit vorausgefüllten Werten)
- [x] KO-Phase: Playtomic-Satzeingabe (gleiches Modal wie Gruppenphase)
- [x] KO-Baum: Satzergebnisse als Detail-Zeile unter den Teams anzeigen (z.B. "6:4  3:6  10:8")
- [x] KO-Baum: Gespielte Matches ebenfalls bearbeitbar (✏️-Icon sichtbar)
