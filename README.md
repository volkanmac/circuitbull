# Circuitbull® — Volls Global Inc

Live site: [circuitbull.com](https://circuitbull.com) · Repo: [volkanmac/circuitbull](https://github.com/volkanmac/circuitbull)

Made in USA: IoT, SCADA, and Carbon Live Monitoring. Thermal & EO/IR cameras are catalog sensors.

## Quick start

```bash
cp .env.example .env   # already filled locally
npm install
npm run verify
npm run seed
npm run dev
```

## API (Worker)

| Route | Description |
|-------|-------------|
| `GET /api/v1/company?lang=en` | HQ from Mongo (address, phone, trademark) |
| `GET /api/v1/partners?country=TR` | Distributors / authorized sales by country |
| `GET /api/v1/investments?lang=en` | Gov/enterprise project investments |
| `GET /api/v1/solutions/border-control?lang=en` | Solution page JSON + rich snippet SEO |

Solution URLs (public): `/:lang/solutions/:need` e.g. `/en/solutions/border-control`

## Secrets

- `.env`, `.dev.vars`, `api-keys.txt` are gitignored.
- Rotate any keys that were pasted in chat.
