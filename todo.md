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
