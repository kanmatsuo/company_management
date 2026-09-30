# company_management

Next.js frontend for the company management API. The browser talks only to this app. This app calls Django with `API_URL`.

## Requirements

- Node.js 20 or newer (this machine uses the current LTS)
- npm

## Environments

| File | When it loads | `API_URL` |
|---|---|---|
| `.env.development` | `npm run dev` | Staging `https://13.140.168.156:8443` |
| `.env.local` | Overrides the file above. Gitignored. | Optional machine override |
| `.env.production` | `npm run build` / `npm run start` if the process has no `API_URL` | Set this on the offline server to the internal Django origin |
| `.env.example` | Not loaded. Documents the variable. | — |

`npm run dev` trusts the staging certificate in `certs/staging.crt` (`NODE_EXTRA_CA_CERTS`). Do not disable TLS verification.

HTTP fallback, if the certificate cannot be used: `API_URL=http://13.140.168.156:8088` in `.env.local`.

## Commands

```bash
npm run dev           # http://localhost:3000
npm run generate:api  # refresh src/api/schema.d.ts from the live OpenAPI schema
npm run build         # standalone bundle for the offline server
npm run start
```

Production copies `.next/standalone`, `.next/static`, and `public/` onto the offline server with a matching Node.js runtime. nginx sends `/api/` to Django and everything else to Next.js. Set `API_URL` in that service environment.
