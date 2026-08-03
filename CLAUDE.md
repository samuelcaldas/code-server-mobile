# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

- The repository's primary goal is UI/UX adaptation of VS Code for smartphones and other small touch screens.
- Treat small touch-screen usability and responsive behavior as core product constraints while preserving desktop behavior.

## Environment & Infrastructure

- **Dev Host / Context:** `docker-dev` remote context (builds, dev, tests).
- **Prod Host / Context:** `docker-vm` remote context (`10.250.50.165` - Ubuntu Server).
- **Domain & DNS:** Wildcard DNS `*.dev.timoteo.mg.gov.br` points to `docker-vm` (`10.250.50.165`).
- **Nginx Proxy Manager (NPM):** Running on server `fs01002` (`10.250.50.60`). Configured manually (do NOT automate programmatically).

## Setup and Development

- Use `npm` only. The `preinstall` script rejects Yarn.
- `.node-version` is `24.18.0`; `package.json` engines and `docs/CONTRIBUTING.md` declare Node 22. Follow `.node-version` for the current repository and CI unless intentionally testing Node 22 compatibility.
- Initialize the VS Code submodule and apply the patch stack before installing dependencies:

```sh
git submodule update --init
quilt push -a
npm install
```

- `npm run watch` starts the development server at `http://localhost:8080`, compiling both the root project and patched VS Code. Browser refresh is manual.

## Builds and Releases

```sh
npm run build
VERSION=0.0.0 npm run build:vscode
KEEP_MODULES=1 npm run release
./release/bin/code-server
npm run package
```

- `npm run build` compiles the root wrapper and service layer.
- `VERSION=0.0.0 npm run build:vscode` builds the patched VS Code payload.
- `KEEP_MODULES=1 npm run release` combines root output, assets, and VS Code into a runnable release; `npm run package` produces release packages.

## Validation

```sh
npm run test:unit
npm run test:unit -- test/unit/node/app.test.ts
npm run test:scripts
npm run test:integration
CODE_SERVER_PATH=/path/to/code-server npm run test:integration -- test/integration/help.test.ts
```

- Integration tests need a release binary. Set `CODE_SERVER_PATH` to test an existing binary.
- E2E requires both `out/` and `lib/vscode/out/`:

```sh
npm run test:e2e
npm run test:e2e -- --project "Mobile Chromium" --grep "should classify a phone viewport"
npm run test:e2e:proxy
```

- `npm test` intentionally fails and directs callers to explicit suites.
- Playwright images and artifacts folder `.playwright-mcp` must be gitignored. All screen captures must reside in `.playwright-mcp`.
- `npm run lint:ts` and `npm run prettier` modify files. Use `npx prettier --check .` for a non-writing format check.
- `npm run lint:scripts` lints shell scripts. `npm run fmt` also rewrites documentation TOCs.
- For `lib/vscode`, use the smallest relevant validation. `npm run typecheck-client`, `npm run test-browser-no-install`, and `scripts/test.sh --grep <pattern>` are scope-appropriate; broad VS Code builds are expensive.

## Architecture

- Root TypeScript is the wrapper and service layer around patched VS Code.
- Server entry chain: `src/node/entry.ts` → parent/child supervisor in `src/node/wrapper.ts` → `runCodeServer` in `src/node/main.ts` → listener creation in `src/node/app.ts` → ordered route registration in `src/node/routes/index.ts`.
- `src/node/routes/vscode.ts` dynamically imports `lib/vscode/out/server-main.js`, then forwards authenticated HTTP requests and origin-checked WebSockets to the patched VS Code server.
- Root routes own login, health, updates, static assets, and path/domain proxying. Preserve reverse-proxy and base-path handling; never hardcode root `/` URLs.
- Browser templates and assets are in `src/browser`; compiled root output is `out`. Release scripts combine root output and assets with the VS Code payload.

## VS Code Submodule and Patches

- `lib/vscode` is the Microsoft VS Code submodule. code-server changes there are ordered quilt patches listed in `patches/series`.
- Before ordinary VS Code patch work, pop `csp-hashes.diff`. For an existing patch, use `quilt pop`/`quilt push <patch>` until it is top.
- For a new patch, run `quilt new <name>.diff` while `csp-hashes.diff` is unapplied so it is inserted before the final CSP patch.
- Run `quilt add [-P <patch>] <file>`, edit, `quilt refresh`, then `quilt push -a`. Never edit `.pc` or place ordinary patches after the regenerated final `csp-hashes.diff`.
- Prefer root code for functionality independent of VS Code rather than expanding the patch stack.

## Tests by Ownership

- Root Jest tests mirror `src` under `test/unit`.
- Bats tests live under `test/scripts`; integration tests validate packaged binaries; Playwright E2E tests live under `test/e2e`.
- VS Code-owned tests remain under `lib/vscode/src/vs/**/test`.

## Rules Inside `lib/vscode`

- Follow `lib/vscode/.claude/CLAUDE.md` and `lib/vscode/.github/copilot-instructions.md`.
- Preserve layer direction: `base` → `platform` → `editor` → `workbench`.
- Use constructor dependency injection. Place non-service parameters before service parameters.
- Use tabs and Microsoft copyright headers. Localize user-visible strings through `vs/nls`.
- Register disposables immediately using existing disposable helpers.
- Do not bypass component APIs through storage keys, event-driven control flow, or late `IInstantiationService` service lookup.
- Use `IEditorService` to open editors. Avoid `any` and `unknown` unless necessary.
- Run `npm run valid-layers-check` only for layer-affecting changes.
- Follow local test-suite patterns and run targeted validation.
