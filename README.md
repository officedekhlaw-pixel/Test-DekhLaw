# DekhLaw — Backend API

> India's Legal Emergency Platform — Express.js backend powering all forms, data storage, and admin management.

---

## What This Backend Does

| Form / Feature | Endpoint | Stored In |
|---|---|---|
| User Registration | `POST /api/auth/register/user` | `users` table |
| Lawyer Registration | `POST /api/auth/register/lawyer` | `lawyers` + `lawyer_verifications` tables |
| SOS Emergency Request | `POST /api/sos` | `sos_requests` table |
| Contact Us | `POST /api/contact` | `contact_messages` table |
| Lawyer Search | `GET /api/lawyers?city=&practice_area=` | Reads `lawyers` table |
| Admin Login | `POST /api/auth/login/admin` | `admins` table |
| Admin Dashboard | `GET /api/admin/dashboard` | All tables (counts) |
| Lawyer Verification Queue | `GET /api/admin/verifications` | `lawyer_verifications` table |

---

## Quick Start (5 minutes)

### 1. Install Node.js
Requires Node.js 18+. Download from https://nodejs.org

### 2. Install dependencies
```bash
cd dekhlaw-backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET
```

### 4. Create first admin account
```bash
npm run seed
# Creates admin@dekhlaw.com / DekhLaw@2026!
# Change these in .env before running
```

### 5. Start the server
```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Server runs at **http://localhost:5000**

### 6. Update your frontend
In `js/api.js` (or the updated `api.js` provided), set:
```js
const API_BASE = 'http://localhost:5000/api'; // dev
// or for production:
window.DEKHLAW_API_BASE = 'https://api.dekhlaw.com/api';
```

---

## Project Structure

```
dekhlaw-backend/
├── server.js                  ← Entry point, Express app setup
├── package.json
├── .env.example               ← Copy to .env
├── api.js                     ← Drop into frontend: js/api.js
│
├── config/
│   └── db.js                  ← Database (SQLite default, Postgres option)
│
├── middleware/
│   ├── auth.js                ← JWT verify, role check, token issue
│   ├── upload.js              ← Multer: profile photos + verification docs
│   └── validate.js            ← express-validator rules for all forms
│
├── routes/
│   ├── auth.js                ← /api/auth/* (register user, lawyer, admin login)
│   ├── sos.js                 ← /api/sos/* (submit, list, assign, status)
│   ├── contact.js             ← /api/contact/* (submit, list, mark-read)
│   ├── lawyers.js             ← /api/lawyers/* (search, profile, rate)
│   └── admin.js               ← /api/admin/* (dashboard, verifications, manage)
│
├── utils/
│   ├── notify.js              ← WhatsApp / SMS notification stubs
│   └── seed.js                ← Creates first admin account
│
└── uploads/                   ← Auto-created on first run
    ├── profiles/              ← User & lawyer profile photos
    └── docs/                  ← Lawyer Bar Council verification documents
```

---

## Database Schema

The database is created automatically on first run (SQLite). All tables:

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Auto primary key |
| full_name | TEXT | Required |
| phone | TEXT | Unique, 10-digit cleaned |
| email | TEXT | Optional, unique |
| city | TEXT | |
| profile_photo | TEXT | Filename in uploads/profiles/ |
| whatsapp | INTEGER | 1=yes, 0=no |
| is_verified | INTEGER | Default 0 |
| created_at | TEXT | Auto timestamp |

### `lawyers`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Auto primary key |
| full_name | TEXT | Required |
| phone | TEXT | Unique |
| email | TEXT | Optional |
| city / state | TEXT | |
| practice_area | TEXT | e.g. "Criminal Law" |
| years_experience | TEXT | e.g. "5–10 Years" |
| bar_council_number | TEXT | Unique, required |
| court_of_practice | TEXT | |
| profile_photo | TEXT | Filename |
| verification_doc | TEXT | Filename (Bar Council cert) |
| is_verified | INTEGER | 0=pending, 1=approved |
| is_active | INTEGER | 1=live on platform |
| rating | REAL | 0–5, updated on reviews |
| total_ratings | INTEGER | |

### `sos_requests`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Auto primary key |
| name | TEXT | Requester name |
| phone | TEXT | |
| city | TEXT | |
| legal_issue | TEXT | Dropdown value |
| description | TEXT | Optional extra detail |
| status | TEXT | pending / assigned / resolved / cancelled |
| assigned_lawyer_id | INTEGER | FK → lawyers |
| fee_collected | INTEGER | 0=no, 1=₹199 collected |
| created_at | TEXT | |

### `contact_messages`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | Auto primary key |
| name / email / phone | TEXT | |
| message | TEXT | |
| is_read | INTEGER | 0=unread |
| replied_at | TEXT | Set when admin marks read |

### `lawyer_verifications`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | |
| lawyer_id | INTEGER | FK → lawyers |
| status | TEXT | pending / approved / rejected |
| admin_notes | TEXT | Rejection reason etc. |
| reviewed_at | TEXT | |

### `admins`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER | |
| email | TEXT | Unique |
| password_hash | TEXT | bcrypt |
| name | TEXT | |

---

## API Reference

### Auth

```
POST /api/auth/register/user
Content-Type: multipart/form-data
Fields: full_name, phone, email (opt), city, whatsapp, profilePhoto (file, opt)
→ { success, token, user }

POST /api/auth/register/lawyer
Content-Type: multipart/form-data
Fields: full_name, phone, email (opt), city, state, practice_area,
        years_experience, bar_council_number, court_of_practice,
        whatsapp, bio (opt), profilePhoto (file, opt), verificationDoc (file, opt)
→ { success, token, lawyer }

POST /api/auth/login/admin
Content-Type: application/json
Body: { email, password }
→ { success, token, admin }

POST /api/auth/login/user
Body: { phone }
→ { success, token, user }
```

### SOS
```
POST /api/sos
Body: { name, phone, city, legalIssue, description (opt) }
→ { success, sosId, matchedLawyers }

GET /api/sos/:id
→ { success, data: { ...sos, lawyer_name, lawyer_phone } }

GET /api/sos                          ← Admin only
GET /api/sos?status=pending&city=Delhi

PATCH /api/sos/:id/status             ← Admin only
Body: { status: "assigned" }

PATCH /api/sos/:id/assign             ← Admin only
Body: { lawyerId: 5 }
```

### Contact
```
POST /api/contact
Body: { name, email, phone, message }
→ { success, message }

GET /api/contact                       ← Admin only
PATCH /api/contact/:id                 ← Admin only (mark read)
```

### Lawyers
```
GET /api/lawyers
Query: city, practice_area, experience, name, page, limit, sort
→ { success, data: [...], total, page, pages }

GET /api/lawyers/:id
→ { success, data: { ...lawyer } }

POST /api/lawyers/:id/rate             ← Auth required
Body: { rating: 4 }
```

### Admin
```
GET  /api/admin/dashboard
GET  /api/admin/verifications?status=pending
PATCH /api/admin/verifications/:id
      Body: { action: "approve" | "reject", notes: "..." }

GET  /api/admin/lawyers
PATCH /api/admin/lawyers/:id
DELETE /api/admin/lawyers/:id

GET  /api/admin/users
```

---

## Deployment (Render / Railway / VPS)

### Option A — Render.com (Free tier)
1. Push backend to GitHub
2. New Web Service → connect repo
3. Build: `npm install`
4. Start: `npm start`
5. Add env vars in Render dashboard
6. Free PostgreSQL addon available

### Option B — Railway
1. `railway init` → deploy
2. Add PostgreSQL plugin
3. Set `DB_TYPE=postgres` + PG vars from Railway dashboard

### Option C — VPS (DigitalOcean / AWS)
```bash
# Install Node + PM2
npm install -g pm2
pm2 start server.js --name dekhlaw-api
pm2 save && pm2 startup

# Nginx reverse proxy
server {
  listen 80;
  server_name api.dekhlaw.com;
  location / {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## Switching from SQLite to PostgreSQL

1. Set in `.env`:
```
DB_TYPE=postgres
PG_HOST=your-host
PG_DB=dekhlaw
PG_USER=postgres
PG_PASSWORD=your-password
```

2. Create the tables in Postgres using the schema in `config/db.js` (convert `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`, `TEXT DEFAULT (datetime('now'))` → `TIMESTAMPTZ DEFAULT NOW()`).

3. Restart server.

---

## Enabling WhatsApp Notifications (SOS Alerts to Lawyers)

1. Sign up at https://app.wati.io (or use Twilio for WhatsApp Business)
2. Add to `.env`:
```
WATI_API_URL=https://live-mt-server.wati.io/YOUR_ACCOUNT/api/v1
WATI_API_KEY=your_token
```
3. When an SOS is submitted, the 3 best-matched verified lawyers in that city automatically get a WhatsApp message with the client's name, phone, city, and issue type.

---

## Security Checklist Before Going Live

- [ ] Change `JWT_SECRET` to a 64+ character random string
- [ ] Change admin password from default
- [ ] Set `FRONTEND_URL` to your actual domain (CORS)
- [ ] Use HTTPS (Render/Railway provide this free)
- [ ] Move file uploads to S3 or Cloudinary (update `middleware/upload.js`)
- [ ] Set `DB_TYPE=postgres` for production
- [ ] Enable `NODE_ENV=production`
