# Workflows

## CI/CD Overview

The project uses GitHub Actions for continuous integration and deployment. Two workflows automate the testing and release pipeline.

```
Pull Request ──▶ CI (test) ──▶ Merge to main ──▶ Deploy (build + publish)
```

---

## CI Workflow

**File:** `.github/workflows/ci.yml`
**Trigger:** Pull requests targeting the `main` branch

### Steps

1. **Checkout** — Clone the repository using `actions/checkout@v4`.
2. **Setup Node.js** — Install Node.js 20 with npm caching via `actions/setup-node@v4`.
3. **Install dependencies** — Run `npm ci` for a clean, reproducible install from `package-lock.json`.
4. **Run tests** — Execute `npm test` (which runs `vitest run`), executing all unit, hook, component, and integration tests.

### Purpose

Ensures that all proposed changes pass the full test suite before being merged. Pull requests with failing tests are flagged.

---

## Deploy Workflow

**File:** `.github/workflows/deploy.yml`
**Trigger:** Pushes to the `main` branch

### Steps

1. **Checkout** — Clone the repository.
2. **Setup Node.js** — Install Node.js 20 with npm caching.
3. **Install dependencies** — Run `npm ci`.
4. **Build** — Run `npm run build`, which:
   - Compiles TypeScript via `tsc -b`
   - Bundles the application with Vite
   - Outputs static files to `dist/`
5. **Configure Pages** — Set up GitHub Pages via `actions/configure-pages@v5`.
6. **Upload artifact** — Upload the `dist/` directory as a Pages artifact via `actions/upload-pages-artifact@v3`.
7. **Deploy** — Publish to GitHub Pages via `actions/deploy-pages@v4`.

### Concurrency

The deploy workflow uses a concurrency group (`pages`) with `cancel-in-progress: true`. If a new push arrives while a deployment is in progress, the older deployment is cancelled in favor of the newer one.

### Permissions

The workflow requires:
- `contents: read` — To clone the repository
- `pages: write` — To publish to GitHub Pages
- `id-token: write` — For GitHub Pages OIDC authentication

---

## Local Development Workflow

### Development Server

```bash
npm run dev
```

Starts the Vite development server with hot module replacement. The app is available at `http://localhost:5173/sunlight-visualizer/`.

### Build

```bash
npm run build
```

Compiles TypeScript and bundles the app for production. Output goes to `dist/`.

### Preview

```bash
npm run preview
```

Serves the production build locally for verification before deploying.

### Test

```bash
npm test
```

Runs the full test suite once using Vitest. For watch mode during development, use `npx vitest` directly.

---

## Build Pipeline

```
Source (TypeScript + JSX)
        │
        ▼
   TypeScript Compiler (tsc -b)
   ── Type checking
   ── Declaration generation
        │
        ▼
   Vite Bundler
   ── JSX transformation via @vitejs/plugin-react
   ── Tree shaking
   ── Code splitting
   ── Asset optimization
        │
        ▼
   dist/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   └── index-[hash].css
   └── ...
```
