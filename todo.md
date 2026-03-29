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
