# AI change record

## 2026-10-18 — Initial independent demo

- Created a new, dependency-free Ripples project. No NewRoots files were copied or modified.
- Implemented five responsive sections, local household and bill storage, unit conversions, charts, EIA electricity comparison, an illustrative map, and a shower simulator.
- Selected U.S. EIA 2024 Utah residential-account average (774 kWh/month) as an explicitly labeled electricity reference. Omitted a statewide household water number because Utah's published GPCD reporting method includes other user categories and is not directly comparable.
- Labeled the map as an interaction preview with no community data, and simulator output as estimates.

Student team review needed: verify calculations with sample utility bills, review the text and visual design, check accessibility on mobile and desktop, decide if the project should migrate to a framework or backend, and replace the stylized map with authoritative Utah county geometry when ready.

## 2026-10-18 — P0 acceptance and fixes

- Ran isolated browser acceptance: initial 22/26 passed; fixed the four reproduced failures, expanded coverage and finished at 32/32.
- Fixed zero-use bills and zero baselines, stale edit state, malformed stored-state crashes, and keyboard focus loss.
- Improved long mobile charts with legible ticks and an accessible values table, normalized monthly goal comparisons for bill duration, and hardened validation while preserving drafts.
- Improved mobile field sizing, touch controls, safe-area spacing, muted text contrast, selected-state semantics, and reduced-motion scrolling.
- Retained the unresolved residential-water benchmark as an explicit P0 gap. Rechecked the existing EIA source.
- Saved the reproducible checks and a scoped report in P0_ACCEPTANCE.md. Real iOS/Android devices and Safari have not been validated.

## 2026-10-18 — Same-Wi-Fi phone preview

- Made the local static server's bind address configurable with `HOST`, keeping loopback as the default.
- Started a separate server on this computer's Wi-Fi address and port 5179 so a phone on the same network can open the responsive app directly.
- Restricted the server to app assets and the preview page; project documents and check results are not served by this phone entry.
- Confirmed the Wi-Fi URL returns the app and the original desktop entry remains available. Actual phone behavior requires checking on the device.

## 2026-10-19 — P1 interactive work

- Replaced stylized five-point Utah map with 29 simplified county paths generated from the official SGID county feature service; kept source and limitations visible.
- Added county click, keyboard, and dropdown selection, plus water/electricity labels without fabricated county values.
- Added responsive orb pointer/touch ripples and device-orientation permission handling with secure-context and reduced-motion gating.
- Added adjustable household input to the shower simulator, profile-based action recommendations, and local action goal progress with completion and removal.
- Verified 13/13 focused P1 checks and 32/32 P0 regression checks. On the current LAN HTTP URL, tilt is unavailable until a trusted HTTPS origin is used.

## 2026-10-19 — Separate fictional community map layer

- Added an explicit Demo community layer with fixed, fictional county participation and action-completion fixtures for both water and electricity views. County fill colors visualize only those demo completion rates.
- Kept the official-source layer separate: real SGID county shapes and source-labeled statewide context, with no invented county household utility figures.
- Labelled demo counts and colors throughout the map. The mock figures never include users' local bills, measured gallons or kWh, or claims about real county populations.
- The phone tilt interaction was subsequently confirmed by the user on a temporary HTTPS preview. Existing automated acceptance results predate this map-layer addition; they are not presented as a check of this change.

## 2026-10-19 — More specific action guidance

- Added action context from the household profile and per-day water/electric bill trend, with wording that avoids diagnosing a leak or claiming a particular cause for a seasonal change.
- Added optional 30-day estimate panels for measured leak flow, avoided laundry cycles, safely reduced irrigation time, and metered standby power. Each exposes its input-based formula, limitation, and EPA/DOE guidance link; blank inputs produce no savings figure.
- Kept projections separate from stored bills and self-reported action completion. This change has not received a new automated acceptance run.

## 2026-10-19 — P2 challenge prototype

- Added two opt-in seven-day challenge templates to Make a Ripple with one self-reported check-in per local calendar day, same-day undo, and locally retained earlier attempts.
- Kept the challenge experience explicitly labeled as a single-device preview. It displays no invented live participants, leaderboard, measured savings, or verified community claim.
- Documented remaining P2 work in P2_PROGRESS.md. No new automated acceptance run was performed.

## 2026-10-19 — P2 regional ranking preview

- Added a scrollable 29-county leaderboard to the map's explicitly fictional Demo community layer. It ranks by the same simulated action-completion share used for county colors and switches between water and electricity.
- Leaderboard rows select map counties; the current county's position stays visible above the list. The official-source layer states that no verified regional ranking is available.
- This change does not use household bills or local challenge check-ins as community data. No new automated acceptance run was performed.

## 2026-10-19 to 2026-10-21 — P2 implementation and source review

- Added `data-core.js` for bill validation, CSV import/merge/export, rolling-origin usage forecasts and normalized reduction goals. The UI allows review and an explicit duplicate policy before import; forecasts never write bill entries.
- Added `cloud.js`, `config.js` and `supabase/schema.sql` for email accounts, separate private account workspaces, revision-based cloud sync, community evidence upload and suppressed aggregate reporting. The Supabase project URL/publishable key came from the user. No service-role secret is in browser code.
- Added real community challenge UI alongside the earlier local challenge preview, and a reviewer-only script for evidence decisions. Public county reports require at least ten volunteers with reviewed consecutive-month bills; small groups and pending records stay hidden.
- Added official Utah drought context through a same-origin server route and Netlify function, with a dated offline fallback. Added USGS Circular 1441 Table 6's 2015 Utah public-supply domestic 169 gal/person/day reference after checking the original PDF; the page explains its age and coverage.
- Added household progress summary, line/bar chart choice and keyboard-readable values, reduced-motion preference, fixture-flow scenario and corrected the outdoor-irrigation meter wording.
- Added focused calculation, disposable PostgreSQL policy/aggregation and browser acceptance checks. P0 rerun passed 32/32. Hosted Supabase schema/sign-in are still unverified.
- Direct utility-account ingestion awaits a named utility provider and an authorized API. No automatic provider connection or measured community savings are claimed.
- Final local checks after the USGS water comparison, chart and drought-route updates: pure calculations 8/8, P1 browser 12/12, P2 browser 15/15. The remote public challenge-report RPC was still missing at the last check; live authentication and sync remain unverified.
- The user chose to restart Supabase setup. Cleared the old public URL and key from `config.js`, leaving guest data and all integration code in place for the replacement project. No remote project or records were deleted by this local change.
- The user subsequently ran the complete schema in the original supplied project. Confirmed both public reporting RPCs return HTTP 200 with empty arrays; restored its public URL and publishable key in `config.js`. Real account/sync behavior has not yet been checked.
- During the P0/P1/P2 audit, fixed a Profile redraw race: when Supabase finished loading, only the account card now refreshes, preserving household fields being edited. The first P0 rerun exposed the race (31/32); the post-fix rerun passed 32/32. P1 12/12, P2 15/15, calculation 8/8 and disposable database security checks passed. A live account login, private write and second-device sync remain unverified.
- Reworked the opt-in Home hero demo at `?flow-demo=1` as a rectangular water tank. The latest water bill determines the level after 30.44-day normalization; the scale is the user's monthly goal or a clearly labeled 2015 Utah reference. Enabled phone tilt and pointer movement angle the full water surface. A readout shows bill amount, normalized use, scale, and that more water means more use. At that stage the normal page was unchanged; reduced-motion settings kept the tank still.


## 2026-10-21 — Partner P0 audit and demo sample data

- Shortened Make a Ripple to one simulator, three tips, and one goal tracker; collapsed My Usage import/history; shortened Explore Utah to map, county details, and a top-five leaderboard with the full list optional.
- Hid account login and shared submissions in the UI until multi-account privacy and sync behavior is verified. Fictional county data remains explicitly labeled.
- Added an opt-in 12-month fictional 2025 water/electricity dataset for presentations. It is available only when no bills are saved, does not change the household profile, and displays a site-wide fictional-data notice.
- Re-ran acceptance checks: P0 33/33, P1 12/12, P2 15/15, data calculations 8/8. These are local browser/code checks, not evidence of live multi-account sync or real-phone compatibility.


## 2026-10-21 — Partner checklist follow-up

- Consolidated bill-based reduction goals under the single Make a Ripple goal tracker in a collapsed subsection.
- Updated the P2 browser test to expand the subsection before checking goal creation, persistence, and completion.
- Re-ran checks: P0 33/33, P1 12/12, P2 15/15, calculations 8/8.
- Re-published a static, password-protected temporary HTTPS preview with an empty Supabase browser config; no account keys or user records were included.

- Moved the rectangular water tank from the opt-in flow demo to the default Home card. It now replaces the round orb, uses the latest water bill for its level, and keeps pointer, touch, phone tilt, sample preview, and reduced-motion behavior.

- Replaced the rectangular tank’s flat rotated surface with two SVG wave layers and a light crest. Gentle motion runs while water is visible; pointer movement or phone tilt adds a damped slosh that settles naturally. Empty tanks do not keep animating, and reduced-motion settings draw a still surface.

- Moved the water-level readout, sample slider, and tilt control beneath the Home water tank so the moving surface remains unobstructed; removed the dark bordered overlay panel.

- Prepared Ripples as an installable PWA: manifest, icon sizes, root service worker with offline shell, static build with cloud configuration omitted, and Netlify build/function configuration. Live drought remains network-only with the existing dated snapshot fallback.

## 2026-10-25 — Release debug pass

- Added reproducible Playwright and PGlite development dependencies, replacing a missing temporary PGlite path. Updated P0 checks for the water-level readout and slider that the student requested to remove.
- Added an isolated SQL check for the 1,059 fictional showcase records, idempotent reseeding, public aggregate access and private table access. Re-ran calculation, P0, P1 and P2 browser checks.
- Improved Home water-overlay text contrast and the 320px card-heading layout after visual inspection. Kept the display's 50% no-bill starting level and bill-derived level behavior.
- Moved Capacitor CLI to development dependencies. The official npm audit found no vulnerabilities in production dependencies; the native build toolchain retains a moderate transitive advisory.
- Clarified the README and P2 status. Live multi-account behavior and the final contest materials remain student review tasks.
