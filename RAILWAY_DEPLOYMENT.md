# Railway.app Deployment – Padel Turnier Backend

Diese Anleitung beschreibt, wie der Express/tRPC-Backend-Server der Padel Turnier App auf [Railway.app](https://railway.app) deployed wird.

---

## Überblick

Der Backend-Server (`server/`) ist ein Node.js-Express-Server mit tRPC-API, der optional eine MySQL-Datenbank und Manus OAuth nutzt. Die App selbst (React Native / Expo) läuft weiterhin lokal auf dem Gerät — nur der Server wird auf Railway gehostet.

| Komponente | Wo läuft es? |
|------------|--------------|
| React Native App | Auf dem Gerät (iOS / Android) |
| Backend-Server (Express + tRPC) | Railway.app |
| Datenbank (MySQL) | Railway MySQL Plugin oder PlanetScale |

---

## Voraussetzungen

Bevor du startest, stelle sicher dass du folgendes hast:

- Ein [Railway.app-Konto](https://railway.app) (kostenloser Starter-Plan reicht)
- [Railway CLI](https://docs.railway.app/develop/cli) installiert (`npm install -g @railway/cli`)
- Das Projekt-Repository auf GitHub oder GitLab (empfohlen) **oder** lokal via CLI
- Node.js 22+ und pnpm 9.12.0 lokal installiert

---

## Schritt 1: Datenbank einrichten

Railway bietet ein eingebautes MySQL-Plugin. Öffne dein Railway-Projekt, klicke auf **"+ New"** → **"Database"** → **"MySQL"**. Railway erstellt automatisch eine Datenbankinstanz und stellt die Variable `DATABASE_URL` im Projekt bereit.

Alternativ kann [PlanetScale](https://planetscale.com) (kostenloser Plan) als externe MySQL-Datenbank genutzt werden. In diesem Fall muss `DATABASE_URL` manuell als Umgebungsvariable gesetzt werden.

---

## Schritt 2: Projekt auf Railway deployen

### Option A: GitHub-Integration (empfohlen)

1. Pushe das Repository auf GitHub.
2. Öffne [railway.app/new](https://railway.app/new) und wähle **"Deploy from GitHub repo"**.
3. Wähle das Repository aus.
4. Railway erkennt die `railway.json` und das `Dockerfile` automatisch.
5. Der erste Build startet sofort.

### Option B: Railway CLI (lokal)

```bash
# Einmalig einloggen
railway login

# Neues Projekt erstellen und verknüpfen
railway init

# Deployen
railway up
```

---

## Schritt 3: Umgebungsvariablen setzen

Öffne im Railway-Dashboard dein Service → **"Variables"** und trage folgende Werte ein:

| Variable | Pflicht | Beschreibung |
|----------|---------|--------------|
| `DATABASE_URL` | ✅ Ja | MySQL-Verbindungsstring (wird automatisch vom MySQL-Plugin gesetzt) |
| `JWT_SECRET` | ✅ Ja | Zufälliger String (min. 32 Zeichen) für Session-Tokens |
| `NODE_ENV` | ✅ Ja | Auf `production` setzen |
| `VITE_APP_ID` | Nein | App-ID für Manus OAuth (nur wenn OAuth genutzt wird) |
| `OAUTH_SERVER_URL` | Nein | URL des Manus OAuth-Servers |
| `OWNER_OPEN_ID` | Nein | OpenID des Admin-Benutzers |
| `BUILT_IN_FORGE_API_URL` | Nein | Manus LLM API URL (für AI-Features) |
| `BUILT_IN_FORGE_API_KEY` | Nein | Manus LLM API Key |

> **Hinweis:** `PORT` wird von Railway automatisch gesetzt und muss **nicht** manuell konfiguriert werden. Der Server liest `process.env.PORT` bereits korrekt aus.

Ein JWT-Secret kann mit folgendem Befehl generiert werden:

```bash
openssl rand -base64 32
```

---

## Schritt 4: Datenbankmigrationen ausführen

Nach dem ersten erfolgreichen Deploy müssen die Datenbanktabellen erstellt werden. Verbinde dich via Railway CLI mit dem laufenden Service:

```bash
# Railway-Shell öffnen
railway shell

# Migrationen ausführen
pnpm db:push
```

Alternativ kann ein einmaliger "Migration Job" in Railway als separater Service konfiguriert werden, der `pnpm db:push` beim Start ausführt.

---

## Schritt 5: App auf den neuen Server-URL zeigen

Nach dem Deployment vergibt Railway eine öffentliche URL (z.B. `https://padel-turnier-production.up.railway.app`). Diese URL muss in der Expo-App als API-Endpunkt eingetragen werden.

Öffne `lib/trpc.ts` und passe die `apiUrl` an:

```ts
// lib/trpc.ts
const apiUrl = __DEV__
  ? "http://127.0.0.1:3000"                          // lokale Entwicklung
  : "https://padel-turnier-production.up.railway.app"; // Railway Production
```

---

## Build-Prozess verstehen

Das `Dockerfile` verwendet einen **zweistufigen Build**:

**Stage 1 (builder):** Installiert alle Abhängigkeiten (inkl. devDependencies) und bündelt den Server mit `esbuild` zu einer einzelnen `dist/index.js`-Datei.

**Stage 2 (runner):** Startet ein schlankes Production-Image mit nur den Runtime-Abhängigkeiten (`mysql2`, `express`, `drizzle-orm` etc.) und kopiert `dist/index.js` hinein. Das Ergebnis ist ein kleines, schnelles Container-Image.

```
pnpm build
  └─ esbuild server/_core/index.ts
       → dist/index.js  (ESM-Bundle, ~500 KB)
       → dist/viewer.html (statische HTML-Datei)
```

---

## Health Check

Railway prüft automatisch den Endpunkt `GET /api/health`. Der Server antwortet mit:

```json
{ "ok": true, "timestamp": 1234567890 }
```

Solange dieser Endpunkt `200 OK` zurückgibt, gilt der Service als gesund. Bei Fehlern startet Railway den Container automatisch neu (max. 3 Versuche, konfiguriert in `railway.json`).

---

## Kosten

Railway bietet einen kostenlosen **Starter-Plan** mit 500 Stunden/Monat und 512 MB RAM. Für ein Padel-Turnier-Tool mit gelegentlichem Nutzung reicht das vollständig aus. Der MySQL-Plugin kostet ab dem Hobby-Plan ($5/Monat) extra.

| Plan | Preis | RAM | CPU | Datenbank |
|------|-------|-----|-----|-----------|
| Starter | Kostenlos | 512 MB | Shared | Nicht inklusive |
| Hobby | $5/Monat | 8 GB | Shared | MySQL inklusive |
| Pro | $20/Monat | 32 GB | Dedicated | MySQL inklusive |

---

## Fehlerbehebung

**Build schlägt fehl mit "pnpm-lock.yaml not found":** Stelle sicher, dass `pnpm-lock.yaml` im Repository eingecheckt ist (nicht in `.gitignore`).

**Server startet nicht:** Prüfe die Railway-Logs unter **"Deployments" → "View Logs"**. Häufigste Ursache ist eine fehlende oder falsche `DATABASE_URL`.

**CORS-Fehler in der App:** Der Server erlaubt alle Origins (`Access-Control-Allow-Origin: *` im Dev-Modus). In Production sollte die Railway-URL als erlaubter Origin eingetragen werden.

**Datenbankverbindung schlägt fehl:** Railway MySQL-Plugin setzt `DATABASE_URL` automatisch, aber das Format muss `mysql://` (nicht `mysql2://`) sein. Prüfe den Wert im Variables-Tab.
