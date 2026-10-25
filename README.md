# Ripples

Utah household water and electricity conservation app for Congressional App Challenge 2026. NewRoots is a separate preserved project. This mobile-first HTML/CSS/JavaScript app uses a small Node development server. Cloud account and shared-submission UI is currently hidden until multi-account sign-in, privacy, and sync are tested end to end.

## Run

Install Node.js, open Terminal in this folder, and run:

```bash
npm run dev
```

Open <http://127.0.0.1:5178/> for the app or <http://127.0.0.1:5178/preview.html> for a phone frame. No `npm ci` is needed. `npm test` runs pure calculation checks.

The default Home card is a rectangular water tank that fills from the latest water bill normalized to a 30.44-day month. Without a bill, a sample slider lets you preview levels without saving data. The visual scale is the household water goal, or a labeled historical Utah reference when no goal is set. Layered waves move gently, and pointer movement or enabled phone tilt makes the surface slosh and settle; reduced-motion settings keep it still.

## Installable phone app (PWA)

Run `npm run build` to create `dist/`, then publish that folder at a stable HTTPS origin. The build includes only the Supabase publishable browser key so it can read the fictional showcase report; multi-account features stay hidden. The app has a manifest, phone icons, and an offline shell for the five pages, saved bills, and the county map. Live drought data needs a reachable `/api/drought` endpoint; otherwise the app uses its dated saved official snapshot. External fonts and linked source sites still need a connection.

On iPhone, open the HTTPS site in Safari and choose Share → Add to Home Screen → Open as Web App. On Android, use the browser's Install app or Add to Home screen action. `http://127.0.0.1:5178/` is for local development; another phone cannot install it from that address. Browser-local bill storage may be separate from an installed app, so export a backup before moving existing records.

For a connected Netlify deployment, `netlify.toml` builds `dist/` and bundles the existing drought function. A manual upload of only `dist/` provides the saved drought snapshot without the live function.

For Vercel, `vercel.json` selects the static build in `dist/`; `api/drought.mjs` serves the same live drought endpoint. Connect this GitHub repository to Vercel and set the project root to the repository root. Each push to `main` then deploys the site.

## What works

- Five responsive navigation pages.
- Household profile, editable goals, and browser-local persistence.
- Add, edit, and delete water or electricity bills, including older months and duplicate-period confirmation.
- Gallon, kgal, and CCF water conversion; daily normalization; per-person calculations; usage charts.
- Reviewed CSV bill import with duplicate policy, CSV export, JSON backup/restore, line and bar charts with keyboard-readable values, and measured reduction goals.
- An optional 12-month fictional 2025 water/electricity dataset for a clean demo account. It never replaces saved bills and is labeled across the app.
- A sourced 2015 USGS Utah public-supply domestic reference of 169 gal/person/day, including clear age and comparison limits.
- Electricity comparison to EIA's 2024 Utah residential-account monthly average (774 kWh), with calculation and limitations shown in the interface.
- A shower-duration savings simulator, bill- and profile-aware suggestions, and optional input-based estimates for leaks, laundry, outdoor watering, and standby power.
- Two local seven-day challenge templates with daily check-ins and retained attempts; live community participation is not connected.
- A fictional 29-county leaderboard linked to the demo map; no verified regional rankings are claimed.
- Interactive map of all 29 Utah counties using official SGID geometry. A separate, clearly labeled fictional community layer previews participants, action progress, and a color scale for both water and electricity. The official-source layer has no invented county utility figures.
- Supabase schema and cloud service code remain in the repository for future work, but login, sync, and shared submissions stay out of the UI until cross-account checks pass.
- Official Utah drought statistics via a same-origin server route, with a dated offline snapshot. Reservoir and snowpack sources are linked.

## Current limits

Guest data is saved in this browser. County boundaries are simplified from official SGID geometry; fictional community figures are generated locally and are not measured savings. The USGS water reference is historical, statewide, and not season/home-type matched. Savings projections require measured inputs. Direct recurring imports from a utility account still require a named provider, supported data interface and user authorization. No live community figures appear until real reviewed volunteers meet the group threshold.

## Cloud implementation status

`config.js` contains the supplied Supabase Project URL and publishable key. Never place a service-role/secret key in browser code. The full [schema.sql](./supabase/schema.sql) was run in that project's SQL Editor on 2026-10-21. Public report functions returned HTTP 200 with empty arrays, but no real private account write or multi-device sync has been verified. Cloud UI therefore remains hidden. Confirm database objects with:

```sql
select to_regclass('public.household_snapshots') as household_table,
       to_regprocedure('public.challenge_report()') as challenge_function;
```

Both should be non-null. If the table exists but REST still returns PGRST205/PGRST202, run `notify pgrst, 'reload schema';`. Reload the app. Add the app origin to Supabase Auth redirect allow list for email confirmation and password reset. Accounts use private rows with row-level security and revision conflict checks. The guest workspace stays separate.

After the schema was run, the public `challenge_report` and `county_report` RPCs both returned HTTP 200 with empty arrays, as expected before any participants submit data. This verifies the public reporting interface; actual account creation, private writes and two-device synchronization still need a real user check. Do not treat the empty reports as zero conservation.

Community evidence is uploaded only after explicit consent to a private bucket. A human reviewer with a server-side service key uses [review-submission.mjs](./scripts/review-submission.mjs) to decide pending records. Never commit or expose that key. Reviewers must inspect evidence and privacy handling before real public reports.

Sources and calculation decisions are recorded in [RIPPLES_DEMO_PLAN.md](./RIPPLES_DEMO_PLAN.md). AI changes are listed in [AI_CHANGES.md](./AI_CHANGES.md) for student review.

## P0 acceptance

See [P0_ACCEPTANCE.md](P0_ACCEPTANCE.md) for scope and fixes. Latest local checks: P0 33/33, P1 12/12, P2 15/15, and calculation tests 8/8. Local phone preview: http://127.0.0.1:5178/preview.html. Earlier temporary Netlify previews are separate snapshots and do not update with local changes.

## P1 progress

See [P1_PROGRESS.md](P1_PROGRESS.md) for the official 29-county interactive map, separate fictional community layer, simulator, saved action goals, demo bills, and remaining real-phone/deployment work. Device tilt was confirmed by the user on a temporary HTTPS preview; the local HTTP phone URL still cannot enable it.

## P2 progress

See [P2_PROGRESS.md](P2_PROGRESS.md) for requirement-by-requirement status, activation steps, and external dependencies.

Official sources: [USGS Circular 1441, Table 6](https://pubs.usgs.gov/circ/1441/circ1441.pdf), [EIA Table 5A](https://www.eia.gov/electricity/sales_revenue_price/pdf/table_5A.pdf), [Utah county boundaries](https://gis.utah.gov/products/sgid/boundaries/county/), [U.S. Drought Monitor API](https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx), [Utah reservoir levels](https://water.utah.gov/reservoirlevels/).

## Native phone projects (Capacitor)

The `ios/` and `android/` directories are real native app projects containing the current Ripples UI. Run `npm ci` and `npm run mobile:sync` after changing web code. Open them with `npm run mobile:ios` (Xcode) or `npm run mobile:android` (Android Studio). The app uses its bundled web assets and keeps the current browser-local storage behavior; cloud account screens remain hidden in this build.

A distributable iPhone `.ipa` needs full Xcode and Apple signing; an Android `.apk` needs the Android SDK/Studio. The current Mac has neither full Xcode nor an Android SDK, so these source projects are prepared but no installable binary has been compiled here. The app identifier is `org.ripples.utah`; confirm it before App Store / Play Store release.

## Fictional community showcase

Run `supabase/showcase-users.sql` once in the project SQL Editor to seed 1,059 fictional showcase member rows across the 29 Utah counties and two resources. The script is idempotent and keeps these rows in `showcase_users`, separate from real `auth.users`, household snapshots, bills and challenge check-ins. Only a grouped, read-only `showcase_county_report()` function is exposed. The map and ranking display clear fictional-example labels. `showcase-county-stats.json` is the matching offline fallback; the PWA uses this fallback when the database migration has not been applied or the network is unavailable.

The home water tank starts at 50% with no water bill and uses the actual monthly-equivalent bill amount when a water bill exists. The previous sample slider and separate water-level information box have been removed.
