# Azubi - Moderne Projektmanagement-Plattform

Eine moderne, mehrsprachige Projektmanagement-Plattform mit intuitiver Benutzeroberfläche und umfassenden Funktionen für Teams aller Größen.

## 🌟 Features

- **Mehrsprachige Unterstützung** - Deutsch und Englisch
- **Moderne Benutzeroberfläche** - Responsive Design mit Dark/Light Mode
- **Projektverwaltung** - Umfassende Projektplanung und -verfolgung
- **Aufgabenverwaltung** - Prioritäten, Deadlines und Zuweisungen
- **Team-Zusammenarbeit** - Chat, Kommentare und Datei-Sharing
- **Kalender & Termine** - Integrierte Terminplanung
- **Berichte & Analysen** - Detaillierte Einblicke in Projektfortschritt
- **API-Integration** - Umfassende Schnittstellen für externe Tools
- **Sicherheit** - Enterprise-Grade Sicherheit mit DSGVO-Compliance

## 🚀 Technologie-Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS mit erweitertem Design-System
- **Internationalisierung**: next-intl
- **State Management**: React Query (TanStack Query)
- **Icons**: Heroicons, Lucide React
- **Formulare**: React Hook Form mit Zod-Validierung
- **Animationen**: Framer Motion
- **Build Tool**: Vite (Next.js integriert)

## 📋 Voraussetzungen

- Node.js 18+ 
- npm 9+ oder yarn 1.22+
- Git

## 🛠️ Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd azubi-app
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   ```bash
   cp .env.example .env.local
   ```
   
   Bearbeiten Sie `.env.local` und setzen Sie:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

5. **Browser öffnen**
   Navigieren Sie zu [http://localhost:3000](http://localhost:3000)

## 🌍 Internationalisierung

Die Anwendung unterstützt Deutsch (Standard) und Englisch:

- **Deutsch**: `http://localhost:3000/` oder `http://localhost:3000/de`
- **Englisch**: `http://localhost:3000/en`

### Neue Übersetzungen hinzufügen

1. Bearbeiten Sie die Sprachdateien in `messages/`
2. Fügen Sie neue Schlüssel hinzu
3. Verwenden Sie den `useTranslations()` Hook in Ihren Komponenten

## 🎨 Design-System

### Farben
- **Primary**: Blau-Töne für Hauptaktionen
- **Secondary**: Grau-Töne für sekundäre Elemente
- **Accent**: Lila-Töne für Hervorhebungen
- **Success**: Grün-Töne für positive Aktionen
- **Warning**: Orange-Töne für Warnungen
- **Error**: Rot-Töne für Fehler

### Komponenten
- **Button**: Verschiedene Varianten (primary, secondary, outline, ghost)
- **Card**: Einheitliche Karten mit Hover-Effekten
- **Input**: Formularfelder mit Validierung
- **Badge**: Status- und Kategorie-Anzeigen
- **Alert**: Benachrichtigungen verschiedener Typen

## 📱 Responsive Design

Die Anwendung ist vollständig responsive und optimiert für:
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 🔧 Entwicklung

### Verfügbare Scripts

```bash
# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Produktions-Server starten
npm start

# Linting ausführen
npm run lint

# TypeScript-Typen prüfen
npm run type-check

# Tests ausführen
npm run test

# Tests im Watch-Modus
npm run test:watch
```

### Projektstruktur

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Lokalisierte Routen
│   │   ├── layout.tsx     # Hauptlayout
│   │   └── page.tsx       # Startseite
│   └── globals.css        # Globale Styles
├── components/             # React-Komponenten
│   ├── layout/            # Layout-Komponenten
│   ├── sections/          # Seiten-Sektionen
│   └── ui/                # UI-Komponenten
├── lib/                   # Utility-Funktionen
├── providers/             # Context-Provider
└── types/                 # TypeScript-Definitionen
```

### Neue Komponenten erstellen

1. Erstellen Sie eine neue Datei in `src/components/`
2. Verwenden Sie TypeScript für Props-Definitionen
3. Implementieren Sie deutsche und englische Kommentare
4. Fügen Sie Tailwind CSS-Klassen hinzu
5. Testen Sie die Responsivität

### Styling-Richtlinien

- Verwenden Sie Tailwind CSS-Klassen
- Nutzen Sie das vordefinierte Design-System
- Achten Sie auf Dark/Light Mode-Unterstützung
- Implementieren Sie Hover- und Focus-States
- Verwenden Sie die vordefinierten Animationen

## 🧪 Testing

```bash
# Unit-Tests ausführen
npm run test

# Tests mit Coverage
npm run test:coverage

# E2E-Tests (falls konfiguriert)
npm run test:e2e
```

## 📦 Build & Deployment

### Produktions-Build

```bash
npm run build
```

### Deployment

Die Anwendung kann auf verschiedenen Plattformen deployed werden:

- **Vercel** (empfohlen für Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker**

### Docker

```dockerfile
FROM node:18-alpine AS base

# Abhängigkeiten installieren
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Anwendung bauen
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build

# Produktions-Image
FROM base AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
```

## 🔒 Sicherheit

- **HTTPS**: Immer in Produktion verwenden
- **CORS**: Konfiguriert für sichere Cross-Origin-Requests
- **Content Security Policy**: Implementiert für XSS-Schutz
- **Rate Limiting**: API-Endpunkte sind geschützt
- **Input Validation**: Alle Eingaben werden validiert

## 📊 Performance

- **Code Splitting**: Automatisch durch Next.js
- **Image Optimization**: Integrierte Bildoptimierung
- **Lazy Loading**: Komponenten werden bei Bedarf geladen
- **Caching**: Intelligentes Caching-Strategien
- **Bundle Analysis**: `npm run analyze` für Bundle-Größe

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

### Code-Standards

- **TypeScript**: Strikte Typisierung verwenden
- **ESLint**: Code-Qualität sicherstellen
- **Prettier**: Einheitliche Formatierung
- **Kommentare**: Deutsche und englische Kommentare
- **Tests**: Neue Features müssen getestet werden

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

- **Dokumentation**: [docs.azubi.de](https://docs.azubi.de)
- **Issues**: [GitHub Issues](https://github.com/azubi/issues)
- **Discord**: [Community Server](https://discord.gg/azubi)
- **E-Mail**: azubi-app@michelfritzsch.de

## 🙏 Danksagungen

- **Next.js Team** für das fantastische Framework
- **Tailwind CSS** für das flexible CSS-Framework
- **Vercel** für die Hosting-Plattform
- **Open Source Community** für die Inspiration

---

**Entwickelt mit ❤️ in Deutschland**
