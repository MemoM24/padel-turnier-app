# Padel Turnier App – Interface Design

## Color Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `primary` | `#1a9e6f` | `#1a9e6f` | Hauptfarbe (Grün) |
| `primaryDark` | `#0d6b4a` | `#0d6b4a` | Dunkles Grün |
| `primaryLight` | `#e0f5ec` | `#1a3d2e` | Helles Grün (Hintergrund) |
| `background` | `#f4f5f3` | `#111` | Seitenhintergrund |
| `surface` | `#ffffff` | `#1e2022` | Karten/Modals |
| `foreground` | `#111111` | `#ECEDEE` | Primärtext |
| `muted` | `#6b7280` | `#9BA1A6` | Sekundärtext |
| `border` | `rgba(0,0,0,0.09)` | `rgba(255,255,255,0.09)` | Rahmen |
| `amber` | `#f59e0b` | `#FBBF24` | Warnung/BYE |
| `amberLight` | `#fffbeb` | `#2d2000` | Helles Amber |
| `error` | `#ef4444` | `#F87171` | Fehler/Danger |

## Screen List

1. **HomeScreen** – Startbildschirm mit Turnier-Historie
2. **FirebaseConfigScreen** – Firebase-Konfiguration
3. **TournamentTypeScreen** – Wizard Schritt 1: Turniertyp
4. **TournamentSettingsScreen** – Wizard Schritt 2: Punkte, Courts, Spielmodus
5. **PlayersScreen** – Wizard Schritt 3: Spieler hinzufügen
6. **SummaryScreen** – Wizard Schritt 4: Zusammenfassung
7. **MatchesScreen** – Admin: Spielplan (Tab 1)
8. **StandingsScreen** – Admin: Tabelle (Tab 2)
9. **JoinScreen** – Gast betritt Turnier
10. **ViewerScreen** – Gast-Live-Ansicht

## Key User Flows

### Neues Turnier erstellen
Home → TournamentType → Settings → Players → Summary → Matches/Standings

### Turnier fortsetzen
Home (History-Karte tippen) → Matches/Standings

### Gast beitreten
Join-Link öffnen → JoinScreen → Warten auf Genehmigung → ViewerScreen

## Primary Content per Screen

### HomeScreen
- Header mit Logo und Titel
- Button "+ Neues Turnier erstellen"
- FlatList der letzten 20 Turniere (Karten mit Name, Typ, Spieleranzahl, Datum, Status-Badge)
- Button "⚙️ Firebase konfigurieren"

### TournamentTypeScreen
- Step-Indicator (4 Schritte)
- 5 auswählbare Turniertyp-Karten mit Emoji, Titel, Beschreibung

### TournamentSettingsScreen
- Step-Indicator
- Stepper-Komponenten für Punkte/Runden/Aussetzpunkte
- Toggle für Spielmodus (Punkte/Zeit)
- Court-Grid mit Toggle-Buttons

### PlayersScreen
- Step-Indicator
- TextInput + Hinzufügen-Button
- FlatList der hinzugefügten Spieler mit Avatar und Remove-Button
- Chips für gespeicherte Spieler
- QR-Invite-Bar (wenn Firebase aktiv)

### SummaryScreen
- Step-Indicator
- Zusammenfassungskarte mit allen Einstellungen
- "Turnier erstellen"-Button

### MatchesScreen
- Sticky Header mit Turniername und QR-Button
- Tab-Bar (Spiele | Tabelle)
- FlatList der Runden mit Match-Karten
- Score-Modal (Bottom Sheet)
- Timer-Overlay (Vollbild)

### StandingsScreen
- Tabelle mit Rang, Spieler, Spiele, Punkte, Ø

## Component Design

### Avatar
- Kreis mit Initialen, 8 Farben basierend auf Name-Hash
- Größen: sm (28px), md (36px), lg (48px)

### StepIndicator
- 4 Schritte, aktiver Schritt grün gefüllt, vergangene grün mit Häkchen

### MatchCard
- Court-Label, Team 1 vs Team 2, Score-Anzeige
- Grüner Hintergrund wenn Score eingetragen

### ScoreModal
- Bottom Sheet, Grid 0–9 + "10+", ausgewählte Zahl grün

### TimerOverlay
- Vollbild grün (#0d6b4a), MM:SS in 88px DM Mono
- Fortschrittsbalken, Warnung gelb, Danger rot + Blinken
