# 💼 FreelanceOS — Unified Freelancer Workspace
**SPHINX '26 · Problem Statement 1.5** · Working full-stack prototype (React + Node.js)

**Live demo:** https://freelanceos-i62i.onrender.com/

> **Demo login:** `admin@freelanceos.in` / `demo123`
> **Client portal demo (no login):** `/#/portal/meera-demo` · `/#/portal/aarav-demo`

## 1. Problem Statement
> Freelancers juggle separate tools for proposals, invoices, time tracking, contracts and client chat, and often chase late payments manually.

**Target users:** freelancers, creators, small agencies.
**Bonus twist:** client portal with **e-sign** and **progress tracking**.

## 2. Our Solution
One web app where the whole freelance lifecycle is **connected and automated**: a client accepts a proposal → a contract is generated → client e-signs → project board + advance invoice appear automatically → finishing the work auto-generates the final invoice → UPI payment links and escalating reminders collect the money.

| Problem-statement line | Where it lives in FreelanceOS |
|---|---|
| Proposals | Proposals page; client accepts/declines inside the portal |
| Invoices (auto-generated) | Advance invoice on signing, final invoice when all tasks are done, plus manual invoices with live preview + PDF |
| Time tracking | Timer / manual minutes per project + **effective hourly rate** |
| Contracts | Auto-generated from the accepted proposal, SHA-256 sealed on signing |
| Client chat | Real-time-ish chat (8s polling) between freelancer and client portal, with system events |
| Project boards | Kanban (To-do / In progress / Completed) per project |
| UPI payment links | `upi://pay?...` deep link **+ QR code** on every invoice, portal and PDF |
| Automated payment reminders | Server-side escalation engine (runs every minute) + WhatsApp/Email one-tap outbox |
| Single web app | React front-end + Node.js API in one deployable service |
| Stack: React, Node.js | ✅ React 18 + Node.js. DB/payment gateway intentionally mocked for the prototype (see §7) |
| **Bonus: client portal, e-sign, progress tracking** | ✅ Private tokenised portal: proposals, drawn-signature e-sign, live progress timeline, invoices, chat |

## 3. Unique features (beyond the brief)
1. **Zero-touch pipeline** – proposal → contract → project (milestones become tasks) → advance invoice → final invoice, all automatic.
2. **Tamper-evident e-sign** – drawn signature + typed name + timestamp + IP, sealed with a SHA-256 hash of the contract text.
3. **Escalating reminder ladder** – friendly → due → overdue → firm → final, each message carries the UPI QR/link; includes a *fast-forward days* switch for live demos.
4. **Client Payment Health score** – instantly shows whom to chase first.
5. **Effective hourly rate** – budget ÷ tracked hours per project.
6. **Per-client private portal links** – no client sign-up friction.
7. **Live activity feed** and system messages dropped into the client chat.

## 4. Flowcharts

### 4.1 End-to-end lifecycle
```mermaid
flowchart LR
  A[Freelancer creates proposal] --> B[Client opens private portal link]
  B --> C{Decision}
  C -- Decline --> X[Proposal rejected]
  C -- Accept --> D[Contract auto-generated]
  D --> E[Client e-signs - drawn signature + SHA-256 seal]
  E --> F[Project + Kanban created from milestones]
  E --> G[30% advance invoice with UPI QR]
  F --> H[Freelancer moves tasks, tracks time]
  H --> I{All tasks done?}
  I -- Yes --> J[Final invoice auto-generated]
  G --> K[Client pays via UPI]
  J --> K
  K --> L[Invoice marked paid, dashboard + health score update]
  G -. unpaid .-> M[Reminder engine]
  J -. unpaid .-> M
  M -->|WhatsApp / Email + UPI QR| B
```

### 4.2 Payment reminder ladder
```mermaid
flowchart TD
  S[Engine runs every 60s] --> P{Invoice unpaid?}
  P -- No --> E[Skip]
  P -- Yes --> D[Days to due date]
  D --> U[3 days before: Friendly heads-up]
  D --> T[Due today: Due notice]
  D --> O[+1 day: Overdue]
  D --> F[+3 days: Second notice]
  D --> Z[+7 days: Final notice]
  U & T & O & F & Z --> Q{Stage already sent?}
  Q -- Yes --> E
  Q -- No --> R[Log reminder + client chat message + WhatsApp/Email deep link with UPI QR]
```

### 4.3 Architecture
```mermaid
flowchart LR
  subgraph Browser
    R[React 18 SPA\nDashboard, Kanban, Invoices, Reminders]
    PT[Client Portal\nno login, token link]
  end
  subgraph Node.js server
    API[REST API + HMAC auth]
    AUTO[Automation: proposal to contract to project to invoice]
    REM[Reminder engine - cron 60s]
    DB[(JSON file store)]
  end
  R -->|Bearer token| API
  PT -->|portal token| API
  API --> AUTO --> DB
  REM --> DB
  API --> DB
```

## 5. Run locally
```bash
node server.js          # Node 18+, no npm install needed (zero dependencies)
# open http://localhost:3000
```
Reset demo data any time: delete `data/db.json` and restart.

## 6. Deploy
**Render (recommended, free):** push to GitHub (`./push-to-github.sh <repo-url>`) → Render → *New → Blueprint* → pick repo (uses `render.yaml`).
**Railway / Fly / any Docker host:** `Dockerfile` included. **Heroku-style:** `Procfile` included.
Set `BASE_URL`/`SECRET` env vars if desired. Free tiers have ephemeral disks → data resets on redeploy, which is fine for a prototype.

## 7. Prototype scope & roadmap (honest notes)
- **Storage:** JSON file instead of MongoDB for zero-setup deploys. All data access is in `server.js` behind `db`, so swapping to MongoDB is a contained change.
- **Payments:** UPI links/QR are real `upi://` deep links; the "simulate payment" button is a test-mode stand-in for a **Razorpay/Stripe webhook** (next step).
- **Reminders:** generated and logged by the engine; delivery is via one-tap WhatsApp/Email deep links. Next: SMTP / WhatsApp Business API.
- **Auth:** single demo freelancer account; multi-user signup is next.
- **Contract e-sign:** simple electronic signature with audit hash; production would add OTP/Aadhaar eSign.

## 8. Judge demo script (2 minutes)
1. Log in → Dashboard (earnings, overdue alert, client health).
2. **Proposals** → open Aarav's portal → **Accept** → **draw signature & sign**.
3. Back in the dashboard: new project, advance invoice and activity appeared automatically.
4. **Reminders** → set *fast-forward* to `8` → *Run engine* → outbox fills → click **WhatsApp**.
5. **Projects** → move all tasks to Completed → **final invoice auto-generated**.
6. Client portal → scan the UPI QR / click *simulate payment* → earnings update.

## 9. Tech
React 18 + htm (no build step) · Node.js `http` (zero deps) · qrcode-generator (CDN) · JSON store.
Front-end libraries load from public CDNs, so the demo machine needs internet.
