# Azubi App - Backend-Entwicklung

## Übersicht

Dieses Dokument beschreibt die Backend-Architektur und API-Entwicklung der Azubi App.

## Technologie-Stack

### Backend
- **Next.js 15** - Full-Stack Framework
- **Prisma** - ORM für Datenbankoperationen
- **PostgreSQL** - Hauptdatenbank
- **JWT** - Authentifizierung
- **bcryptjs** - Passwort-Hashing
- **Zod** - Schema-Validierung

### Datenbank
- **PostgreSQL** - Relationale Datenbank
- **Prisma Schema** - Datenmodell-Definition

## Projektstruktur

```
src/
├── app/
│   └── api/                    # API-Routen
│       ├── auth/               # Authentifizierung
│       │   ├── login/          # POST /api/auth/login
│       │   ├── register/       # POST /api/auth/register
│       │   └── logout/         # POST /api/auth/logout
│       ├── projects/           # Projekte-API
│       │   └── route.ts        # GET, POST /api/projects
│       ├── tasks/              # Aufgaben-API
│       └── users/              # Benutzer-API
├── lib/
│   ├── db.ts                   # Datenbankverbindung
│   ├── auth.ts                 # Authentifizierungs-Utilities
│   └── middleware.ts           # API-Middleware
└── types/                      # TypeScript-Typen
```

## Datenbank-Schema

### Hauptmodelle

#### User (Benutzer)
- `id`: Eindeutige ID
- `email`: E-Mail-Adresse (unique)
- `username`: Benutzername (unique)
- `password`: Gehashtes Passwort
- `firstName`, `lastName`: Vor- und Nachname
- `role`: Benutzerrolle (ADMIN, MANAGER, USER, TRAINEE)
- `isActive`: Aktiv-Status
- `createdAt`, `updatedAt`: Zeitstempel

#### Project (Projekt)
- `id`: Eindeutige ID
- `name`: Projektname
- `description`: Projektbeschreibung
- `status`: Projektstatus (ACTIVE, COMPLETED, ON_HOLD, CANCELLED)
- `priority`: Priorität (LOW, MEDIUM, HIGH, URGENT)
- `startDate`, `endDate`: Start- und Enddatum
- `budget`: Projektbudget
- `clientName`: Kundenname

#### Task (Aufgabe)
- `id`: Eindeutige ID
- `title`: Aufgabentitel
- `description`: Aufgabenbeschreibung
- `status`: Aufgabenstatus (TODO, IN_PROGRESS, REVIEW, DONE, CANCELLED)
- `priority`: Priorität
- `estimatedHours`, `actualHours`: Geschätzte und tatsächliche Stunden
- `dueDate`: Fälligkeitsdatum
- `assignedTo`: Zugewiesener Benutzer
- `projectId`: Zugehöriges Projekt

#### TimeEntry (Zeiterfassung)
- `id`: Eindeutige ID
- `userId`: Benutzer-ID
- `projectId`: Projekt-ID
- `taskId`: Aufgabe-ID (optional)
- `description`: Beschreibung der Arbeit
- `startTime`, `endTime`: Start- und Endzeit
- `duration`: Dauer in Minuten
- `isBillable`: Abrechenbar

## API-Endpoints

### Authentifizierung

#### POST /api/auth/register
Registriert einen neuen Benutzer.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "firstName": "Max",
  "lastName": "Mustermann"
}
```

**Response:**
```json
{
  "message": "Benutzer erfolgreich registriert",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/auth/login
Meldet einen Benutzer an.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Anmeldung erfolgreich",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "username": "username",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "USER"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/logout
Meldet einen Benutzer ab.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Projekte

#### GET /api/projects
Ruft alle Projekte ab.

**Query Parameters:**
- `status`: Projektstatus (optional)
- `priority`: Priorität (optional)
- `page`: Seitennummer (Standard: 1)
- `limit`: Anzahl pro Seite (Standard: 10)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### POST /api/projects
Erstellt ein neues Projekt.

**Request Body:**
```json
{
  "name": "Projektname",
  "description": "Projektbeschreibung",
  "status": "ACTIVE",
  "priority": "MEDIUM",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "budget": 10000,
  "clientName": "Kundenname"
}
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

## Authentifizierung

### JWT-Token
- **Gültigkeit**: 7 Tage
- **Format**: Bearer Token
- **Header**: `Authorization: Bearer <token>`

### Geschützte Routen
Alle API-Endpoints außer `/api/auth/*` erfordern einen gültigen JWT-Token.

### Rollen-basierte Zugriffskontrolle
- **ADMIN**: Vollzugriff auf alle Endpoints
- **MANAGER**: Zugriff auf Projekte und Aufgaben
- **USER**: Zugriff auf eigene Projekte und Aufgaben
- **TRAINEE**: Eingeschränkter Zugriff

## Middleware

### Auth Middleware
- Validiert JWT-Token
- Überprüft Benutzerberechtigungen
- Fügt Benutzerdaten zu Request-Headers hinzu

### Geschützte Routen
```typescript
const protectedRoutes = [
  '/api/projects',
  '/api/tasks',
  '/api/time-entries',
  '/api/users',
]
```

### Admin-Routen
```typescript
const adminRoutes = [
  '/api/admin',
  '/api/users',
]
```

## Datenbank-Einrichtung

### 1. PostgreSQL installieren
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# PostgreSQL Installer von der offiziellen Website
```

### 2. Datenbank erstellen
```sql
CREATE DATABASE azubi_db;
CREATE USER azubi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE azubi_db TO azubi_user;
```

### 3. Umgebungsvariablen konfigurieren
```env
DATABASE_URL="postgresql://azubi_user:your_password@localhost:5432/azubi_db"
JWT_SECRET="your-super-secret-jwt-key-here"
```

### 4. Prisma-Migrationen ausführen
```bash
# Datenbank-Schema generieren
npx prisma generate

# Migration erstellen
npx prisma migrate dev --name init

# Datenbank-Seed (optional)
npx prisma db seed
```

## Entwicklung

### Lokale Entwicklung
```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Datenbank-Status überprüfen
npx prisma studio
```

### Datenbank-Operationen
```bash
# Schema aktualisieren
npx prisma db push

# Migration erstellen
npx prisma migrate dev --name <migration_name>

# Datenbank zurücksetzen
npx prisma migrate reset

# Prisma Studio öffnen
npx prisma studio
```

## Sicherheit

### Passwort-Sicherheit
- **Salt Rounds**: 12 (bcrypt)
- **Mindestlänge**: 8 Zeichen
- **Validierung**: E-Mail-Format, Benutzername-Eindeutigkeit

### API-Sicherheit
- **Rate Limiting**: 100 Requests pro 15 Minuten
- **CORS**: Konfiguriert für lokale Entwicklung
- **Input Validation**: Zod-Schema-Validierung
- **SQL Injection**: Durch Prisma verhindert

### JWT-Sicherheit
- **Secret**: Umgebungsvariable
- **Expiration**: 7 Tage
- **Algorithm**: HS256

## Testing

### API-Tests
```bash
# Jest-Tests ausführen
npm test

# E2E-Tests
npm run test:e2e

# Coverage-Report
npm run test:coverage
```

### Datenbank-Tests
```bash
# Test-Datenbank
npx prisma migrate dev --name test

# Integration-Tests
npm run test:integration
```

## Deployment

### Produktionsumgebung
```bash
# Build erstellen
npm run build

# Produktionsserver starten
npm start

# Umgebungsvariablen setzen
export NODE_ENV=production
export DATABASE_URL="production_db_url"
export JWT_SECRET="production_jwt_secret"
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring & Logging

### Logging
- **Level**: INFO, WARN, ERROR
- **Format**: JSON
- **Output**: Console, Datei

### Metriken
- **API-Response-Zeiten**
- **Datenbank-Abfragen**
- **Fehlerraten**
- **Benutzer-Aktivität**

## Nächste Schritte

### Geplante Features
1. **E-Mail-Bestätigung** für Registrierung
2. **Passwort-Reset** Funktionalität
3. **Datei-Upload** für Projekte
4. **Real-time Updates** mit WebSockets
5. **API-Dokumentation** mit Swagger
6. **Caching** mit Redis
7. **Background Jobs** mit Bull Queue

### Verbesserungen
1. **Rate Limiting** implementieren
2. **API-Versionierung** hinzufügen
3. **Audit-Logging** für kritische Operationen
4. **Backup-Strategie** entwickeln
5. **Performance-Optimierung** der Datenbankabfragen

## Support

Bei Fragen oder Problemen:
1. **Issues** auf GitHub erstellen
2. **Dokumentation** überprüfen
3. **Community** um Hilfe bitten
4. **Entwickler-Team** kontaktieren

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz.
