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
- [x] Satz-Ergebnis-Eingabe: Playtomic-Stil (Satz 1, Satz 2, Satz 3 mit automatischer Gewinnererkennung)
- [x] Punktevergabe: +3 bei Sieg, +1 bei Unentschieden (2 Sätze gespielt, 3. nicht beendet, Punktgleichheit)
- [x] Paarungsalgorithmus: Max. 2 aufeinanderfolgende Spiele pro Team (Backtracking-Algorithmus)

## Verbesserungen v10 – Swipe/Edit/KO-Sets
- [x] Swipe-to-Delete für Turnierhistorie (Swipeable mit rotem Löschen-Button + Bestätigungsdialog)
- [x] Nachträgliche Bearbeitung von Gruppenspiel-Ergebnissen (✏️-Icon, Modal mit vorausgefüllten Werten)
- [x] KO-Phase: Playtomic-Satzeingabe (gleiches Modal wie Gruppenphase)
- [x] KO-Baum: Satzergebnisse als Detail-Zeile unter den Teams anzeigen (z.B. "6:4  3:6  10:8")
- [x] KO-Baum: Gespielte Matches ebenfalls bearbeitbar (✏️-Icon sichtbar)

## Verbesserungen v11 – Spielplan-Vorschau
- [x] Spielplan-Vorschau: Vor Turnierstart Spielreihenfolge pro Gruppe anzeigen
- [x] Spielplan-Vorschau: Matchnummer, Teams, Court-Zuweisung sichtbar
- [x] Spielplan-Vorschau: Erreichbar aus SummaryScreen und aus Gruppen-Tab (neuer 'Spielplan'-Tab)

## Verbesserungen v12 – Haptic Feedback
- [x] Haptic Feedback: Light beim Tippen auf Match-Karten (Gruppen + KO)
- [x] Haptic Feedback: Success beim Speichern eines Ergebnisses
- [x] Haptic Feedback: Error beim Versuch ein ungültiges Ergebnis zu speichern
- [x] Haptic Feedback: Medium beim Swipe-to-Delete (Bestätigung)
- [x] Haptic Feedback: Selection beim Tab-Wechsel (Gruppen / Spielplan / KO-Baum)
- [x] Haptic Feedback: Success beim Abschluss der Gruppenphase
- [x] Haptic Feedback: Success beim Bestätigen des Löschens eines Turniers

## Verbesserungen v13 – Turnier-Abschlussseite
- [x] Abschlussseite: Automatische Anzeige nach letztem KO-Match
- [x] Abschlussseite: Podium mit 1./2./3. Platz (Sieger, Finalist, Dritter)
- [x] Abschlussseite: Vollständige Platzierungsliste aller Teams
- [x] Abschlussseite: Turnier als "beendet" markieren und in Verlauf speichern
- [x] Abschlussseite: Zurück zur Startseite / Neues Turnier starten

## Verbesserungen v14 – Railway-URL, Spieler-Identifikation, QR-Code-Flow

- [ ] Railway-URL als EXPO_PUBLIC_API_BASE_URL einbauen
- [ ] trpc.ts: Production-URL aus Umgebungsvariable lesen
- [ ] Join-Screen: Vorname/Nachname/Geburtsdatum-Eingabe
- [ ] Spieler-Identifikation: SHA-256-Hash aus Name+Geburtsdatum
- [ ] Spieler-Hash lokal speichern (AsyncStorage), automatische Wiedererkennung
- [ ] QR-Code-Flow: Admin erstellt Turnier → QR zeigt Railway-URL
- [ ] QR-Code-Flow: Spieler scannt vor Start → Join-Screen → Admin bestätigt → Live-Ansicht
- [ ] QR-Code-Flow: Spieler scannt nach Start → direkt zur Live-Ansicht
- [ ] QR-Code-Flow: App erneut öffnen → automatische Wiedererkennung
- [ ] GitHub Push nach allen Änderungen

## Verbesserungen v15 – Spieler-Identifikation

- [x] lib/playerIdentity.ts: SHA-256-Hash aus Vorname+Nachname+Geburtsdatum
- [x] lib/playerIdentity.ts: Identität lokal in AsyncStorage speichern/laden
- [x] Join-Screen: Vorname-Feld (Pflicht, nur Buchstaben, max 20 Zeichen, auto-capitalize)
- [x] Join-Screen: Nachname-Feld (Pflicht, gleiche Regeln wie Vorname)
- [x] Join-Screen: Geburtsdatum-DatePicker (TT.MM.JJJJ, Mindestalter 10, Maximalalter 90)
- [x] Join-Screen: Hinweistexte unter den Feldern
- [x] Join-Screen: Automatische Wiedererkennung (gespeicherte Identität überspringt Formular)
- [x] Join-Screen: "Nicht ich" Button um Identität zurückzusetzen

## Verbesserungen v16 – Persönlicher Padel-Begleiter

- [x] Dark Theme durchgehend, Akzentfarbe #1ed97a
- [x] 4-Tab-Navigation: Mein Spiel, Turnier, Kalender, Profil
- [x] Datenmodell: GameEntry, PlannedGame, PlayerProfile in AsyncStorage
- [x] Tab 1 Dashboard: Greeting, Level-Badge, 3 Ringe, Nächstes Spiel, Formkurve, Skill-Bars
- [x] Tab 1 Tagebuch: Chronologische Liste, Mood-Emoji, Score, Tags, FAB
- [x] Tab 1 Post-Game Sheet: Schritt 1 Basics (Mood, Score, Partner, Gegner)
- [x] Tab 1 Post-Game Sheet: Schritt 2 Court & Position (6 Zonen, Stärken/Fehler)
- [x] Tab 1 Post-Game Sheet: Schritt 3 Schläge & Faktoren (Chips)
- [x] Tab 1 Statistiken: Schlag-Analyse Bars, Court-Heatmap, Störfaktoren
- [x] Tab 3 Kalender: Monatsansicht, Dots, Spiel planen
- [x] Tab 4 Profil: Avatar, Level-Cards, Achievements, Partner-Chemie
- [ ] Wöchentliche Push-Notification (Montag 09:00)
- [ ] Datenschutz-Onboarding beim ersten Start
