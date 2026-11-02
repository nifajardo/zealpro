# Vercel hosting

## Deployment shape

Vercel hosts the current browser-local client demonstration as static files. `vercel.json` explicitly selects **Other** (`framework: null`), builds with `npm run build` and publishes only `dist/`. It does not deploy `server.mjs`, a Node function or the local PostgreSQL API. No database credentials or runtime environment variables are required for this milestone.

The local server remains available through `npm start`. Its PGlite database and API remain local until a separate authenticated persistence cutover to a hosted database. Existing browser records are not uploaded, reset or migrated by the hosting build. A new Vercel origin starts its own browser-local sample workspace.

## Existing GitHub-connected project

Use the existing `zealpro-demo` project and repository; a second project is unnecessary. The production branch is `main`.

| Setting | Value |
| --- | --- |
| Root Directory | Repository root, `.` |
| Framework Preset | Other |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment variables | None for the static demo |

The committed configuration provides these build/output settings. The Root Directory must point at the repository root so Vercel finds the configuration and package files. Do not use `npm start`, `server.mjs` or `public` as the hosted entry point/output.

After the commit reaches the connected production branch, verify the new deployment uses it. If automatic deployments are disabled, redeploy the latest commit from the existing Vercel project. The build log should report **Built 12 browser files in dist/**. Reuse the existing production domain, `https://zealpro-demo.vercel.app/`.

## Local verification

```powershell
npm ci
npm run check
npm test
npm run build
python -m http.server 4390 --bind 127.0.0.1 --directory dist
```

The last command is an optional static preview when Python is available; open `http://127.0.0.1:4390/`. It does not start or open the local database. Stop it with Ctrl+C. Vercel applies the security/cache headers configured in `vercel.json`; the simple Python preview does not emulate those headers.

The build uses only Node's standard library. It removes stale generated output and copies an explicit list of twelve browser files: HTML, two stylesheets, five modules, the unchanged logo, two fonts and their license. `dist/` is generated and ignored by Git. Source paperwork, signatures, `.local/`, real credentials, backend code, documentation and tests are not published. The intentionally public demo presets in `src/access.js` are part of the browser artifact and are not secrets or secure authentication. `.vercelignore` additionally limits CLI source uploads; the explicit `dist/` allowlist is the public-file boundary for Git deployments.

Navigation uses URL fragments such as `/#schedule?date=2026-11-02&view=year`. No catch-all rewrite is needed. Unknown file paths and `/api/*` should return 404 instead of invoking a server or returning app HTML.

## Reported function failure

The existing production domain was verified to return HTTP 500 with `x-vercel-error: FUNCTION_INVOCATION_FAILED` before this change. Its exact runtime exception was not available without Vercel logs. The repository's local Node/database entry point is unsuitable for this static presentation deployment; the new configuration removes that invocation path rather than wrapping it in another function.

After redeployment, check `/`, `/src/app.js`, `/styles.css` and the logo return 200 with suitable content types; check `/api/health`, `/server.mjs` and private paths return 404. Verify Year/Month/Week/Day navigation and refresh on a fragment route. If the old function error remains, confirm the live deployment's commit and root directory, then inspect its build settings/logs. A cached old deployment is not evidence that the new static artifact failed.

This is client presentation readiness, not shared production data readiness. There is no hosted authentication, synchronized database, live reminder or payment integration.

## References

Configuration was checked against [Vercel's project configuration](https://vercel.com/docs/project-configuration/vercel-json), including the Other framework override, output directory and response headers. Source exclusions follow [Vercel's deployment ignore documentation](https://vercel.com/docs/deployments/vercel-ignore).

## Readiness verification

All 41 tests passed with zero failures or skips; syntax and whitespace checks passed. The built artifact loaded in connected Brave with the correct logo and styles, all four calendar view links and twelve Year cards. A fragment-route reload retained Year selection, with no browser warnings/errors. Local static HTTP checks returned 200 for app assets and 404 for API, server, database and source-paperwork paths. Independent source review found no must-fix code issues. Hosted acceptance is checked separately after the Git-connected deployment builds this commit.

## Live acceptance: 2026-11-02

After pushing `0814dd0` to the existing GitHub-connected main branch, `https://zealpro-demo.vercel.app/` returned HTTP 200 instead of the previous function error. HTML, JavaScript, CSS, logo and both fonts matched the committed Git source bytes and had correct content types. Comparing Git blobs avoids Windows working-copy newline differences.

The API, local server/backend, database, environment and source-paperwork paths listed above all returned 404. The configured CSP, nosniff, frame-denial, referrer and cache headers were present. In connected Brave the live overview, logo and General Sans loaded; Schedule and Year navigation worked; Year survived refresh with twelve month cards; browser warning/error logs were empty. [Live screenshot](screenshots/vercel-live-overview.jpg).

This verifies the static client demonstration on the existing domain. No hosted database, function, credentials or production business integration was introduced.
