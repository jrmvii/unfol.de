# unfol.de

Gallery-quality portfolio sites for visual artists. Self-hosted, open source.

## Quick start

### With Docker

```bash
docker run -d \
  -p 3000:3000 \
  -v unfol-data:/app/data \
  -v unfol-uploads:/app/uploads \
  -e DATABASE_URL=file:./data/unfol.db \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e ANALYTICS_SALT=$(openssl rand -hex 16) \
  -e TENANT_SLUG=my-portfolio \
  -e ADMIN_EMAIL=you@example.com \
  -e ADMIN_PASSWORD=changeme \
  ghcr.io/jrmvii/unfol.de:latest
```

Open `http://localhost:3000/admin/login` and sign in with your admin credentials.

### From source

```bash
git clone https://github.com/jrmvii/unfol.de.git
cd unfol.de
cp .env.example .env   # Edit with your values
npm install
npx prisma generate
npx prisma db push
npx prisma db seed     # Creates your tenant + admin user
npm run dev
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path (e.g. `file:./data/unfol.db`) |
| `JWT_SECRET` | Yes | Random string for signing auth tokens |
| `ANALYTICS_SALT` | Yes | Random string for hashing visitor IPs |
| `TENANT_SLUG` | Yes | Your portfolio slug |
| `ADMIN_EMAIL` | Seed | Admin login email |
| `ADMIN_PASSWORD` | Seed | Admin login password |
| `UPLOAD_DIR` | No | Upload directory (default: `./uploads`) |
| `SITE_URL` | No | Public URL for email links |
| `MAILGUN_API_KEY` | No | Mailgun API key for emails |
| `MAILGUN_DOMAIN` | No | Mailgun sending domain |

## Features

- Full-bleed image galleries with smooth transitions
- Video in installation mode
- Customizable colors, fonts, and navigation layout
- Multiple page templates (text, masonry, columns)
- Privacy-first analytics (no cookies, no tracking scripts)
- Image optimization (WebP)
- Custom domain support
- Docker deployment with SQLite

## License

AGPL-3.0 — see [LICENSE](LICENSE).
