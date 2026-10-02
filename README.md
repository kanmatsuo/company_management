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

## Offline server

The offline server has no internet, so it receives the full source with everything needed to develop and build: `.git`, a complete `node_modules`, and the Node.js runtime. Fonts live in `src/app/fonts` (no Google Fonts download).

On a machine with internet and the same OS and CPU as the offline server (native binaries in `node_modules` are platform-specific):

```bash
./scripts/package-offline.sh   # creates dist/management-app-offline.tar.gz
```

On the offline server:

```bash
tar -xzf management-app-offline.tar.gz
sudo tar -xJf node-v*-linux-x64.tar.xz -C /opt
export PATH=/opt/node-v22.23.3-linux-x64/bin:$PATH   # add to ~/.bashrc
cd management-app
```

Create `.env.local` with the local Django origin, for example `API_URL=http://127.0.0.1:8000`. Add the server's address to `allowedDevOrigins` in `next.config.ts` if you open `npm run dev` from another machine.

Then `npm run dev`, `npm run build`, `npm run start`, and `npm run lint` work as usual.

These need internet and do not work offline:

- `npm install <package>`, or upgrading dependencies. Run them on the online machine and package again.
- `npx shadcn add <component>`, which downloads from the shadcn registry.
- `npm run generate:api` works only if `API_URL` points at a Django server reachable from the offline server.
