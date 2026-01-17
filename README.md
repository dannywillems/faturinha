# Faturinha

> *"Little invoice"* in Portuguese - Simple invoicing for small businesses

**Domain**: faturinha.io

## Vision

A **dead-simple, browser-only invoicing system** for freelancers and small
businesses. No server hosting required - users own their data completely.

**Target**: Freelancers, consultants, small shops who need to:

- Create invoices quickly from their phone
- Duplicate previous invoices
- Manage a simple client list
- Send invoices via WhatsApp/Telegram/Email
- Export/backup their data anywhere

## Core Principles

1. **Browser-first, mobile-optimized** - PWA that works offline
2. **API-first** - Clean REST/GraphQL API, UI is just one client
3. **Zero hosting** - Data stored locally (IndexedDB) or user-chosen backends
4. **Privacy by design** - No telemetry, no accounts required for basic use
5. **Stupid simple** - Invoice in 30 seconds, not 5 minutes

## Architecture

```
+----------------------------------------------------------+
|                    PWA (SvelteKit)                       |
|  +---------------------------------------------------+   |
|  |              IndexedDB (local)                    |   |
|  +---------------------------------------------------+   |
|                         |                                |
|                    Sync Adapters                         |
|         +---------------+---------------+                |
|         v               v               v                |
|   Google Drive    Dropbox JSON    S3/MinIO               |
|   (free tier)     (free tier)     (self-host)            |
+----------------------------------------------------------+
                          |
                    Share Adapters
          +---------------+---------------+
          v               v               v
     WhatsApp        Telegram         Email
     (PDF link)      (Bot/link)       (SMTP)
```

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | SvelteKit | Fast, small bundle, good PWA support |
| Storage | Dexie.js (IndexedDB) | Offline-first, reactive |
| PDF | jsPDF + html2canvas | Client-side generation |
| Sync | Dropbox/GDrive SDK | User-controlled, free tier |
| Payments | Stripe | Simple subscription billing |
| Hosting | Cloudflare Pages | Free, fast, global |

## Development

```bash
# Install dependencies
make setup

# Start development server
make dev

# Build for production
make build

# Run tests
make test
```

## License

This project is licensed under the GNU General Public License v3.0 - see the
[LICENSE](LICENSE) file for details.
