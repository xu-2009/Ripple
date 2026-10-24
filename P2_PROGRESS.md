# Ripples P2 progress

Started 2026-10-19; updated 2026-10-21 (America/Denver).

## Initial prototype: community challenge preview

- Added two opt-in challenge templates under **Make a Ripple**: Shorter Shower Week and Power Down Week.
- Each attempt has a seven-calendar-day window, one self-reported check-in per day, same-day undo, an on-device progress display, and locally retained previous attempts. A new attempt can start after the window ends.
- These records use the existing browser localStorage. They are personal challenge records, not a live community count, leaderboard, measured savings, or verified action report.
- Dates are interpreted in the device's local calendar. A participant changing device date or time zone can affect the display; this prototype has no server clock or identity checks.
- At the time of this initial addition, no new automated acceptance run had been performed. Later P2 browser checks are recorded below.

## Added: regional leaderboard preview

- The **Explore Utah → Demo community** view now ranks all 29 counties by the same fictional action-completion share that colors the map. Water and electricity have separate fixed examples.
- Selecting a leaderboard row selects the same county on the map. The selected county's rank is shown above the scrollable list.
- **Official sources** explicitly reports that a verified leaderboard is unavailable. No personal bill or challenge check-in contributes to the fictional ranking.
- This is a UI prototype, not a real regional competition. It was later included in P2 browser checks.

## Requirements identified after the initial prototype

- Real multi-user community challenges and a verified regional leaderboard.
- User accounts and cloud-synchronized records.
- Automatic utility-bill imports, subject to utility availability and user authorization.
- Verified community submissions, consent, and privacy-safe aggregation.
- Advanced predictions and expanded statewide environmental datasets with documented sources.

The first P2 step deliberately did not imply that offline local check-ins were community-wide or independently verified. The current implementation status is listed below.

## 2026-10-21 implementation update

| Partner requirement | Code now present | Still needed for a live claim |
| --- | --- | --- |
| Community challenges | Account-based weekly join/check-in/undo/leave; server-day control; ten-account county threshold | Supabase schema and consenting users |
| Regional leaderboards | Fictional 29-county preview; real reviewed county progress and shared-challenge ranking panels | Reviewers, enough volunteered data; no figures are manufactured |
| User accounts | Supabase email/password signup, confirmation, signin/out, reset and separate account workspace | Remote schema, Auth redirect setup, real user check |
| Automatic bill imports | Strict review-before-save bulk CSV import, duplicate policy and export | A named utility/provider and authorized direct data connector; current CSV import is manual |
| Cloud synchronization | Account-scoped private snapshot, offline copy, optimistic revision conflict resolution | Remote schema and actual two-device check |
| Verified community reports | Consent, private evidence upload, pending/rejected/verified status and operator script | Human reviewer and real opted-in users |
| Advanced predictions | Three-month forecast with backtested 3/6-month average, linear and seasonal candidates; error-derived scenario ranges | Six consecutive bills; no guarantee against weather/occupancy changes |
| Statewide data | USGS/EIA household references and live U.S. Drought Monitor area categories, plus linked reservoir/snowpack sources | Reservoir/snowpack values are links, not imported app metrics |

The SQL passed an isolated PostgreSQL compile and security/aggregation check. The first remote check found no tables or functions; the user then ran the full schema on 2026-10-21. Public `challenge_report` and `county_report` both returned HTTP 200 with empty arrays, and the app was reconnected using the publishable key. The Profile page displayed “Cloud ready” and Create account in a local browser check. After fixing a Profile redraw race, the P0 browser regression at that point passed 32/32, pure calculations 8/8, P1 browser checks 12/12 and P2 browser checks 15/15. The later partner audit adds one P0 sample-data case; see the latest status below. These checks do not prove actual sign-in, private writes or two-device synchronization.


## Partner checklist status — 2026-10-21

P0 and most P1 product checks are implemented locally. Account login/shared submissions remain hidden until genuine multi-account privacy and sync are proven. A 12-month fictional bill sample is available only on an empty bill store and stays labeled across pages. Latest local acceptance totals after the tracker consolidation: P0 33/33, P1 12/12, P2 15/15, calculations 8/8. The P2 goal persistence test opens the new expandable bill-target subsection before checking saved progress.

A 76-second silent demo-footage draft has been recorded from isolated fictional data and saved under `deliverables/`; it still needs student review and narration.

A password-protected one-hour Netlify HTTPS preview has been published for partner review; it is temporary and not a stable deployment. Still outstanding before submission: live two-account/two-device verification; final real-device Safari/Chrome pass; final source handoff; updated technical/source/AI documentation review with both teammates; recorded walkthrough and 1–3 minute video; written competition answers; final submission field/link review and a deadline buffer before Oct 26. No submission has been made.


2026-10-21 update: recorded a 76-second silent demo draft at `deliverables/ripples-demo-footage.mp4`. The student team must review it, add narration, and create the final 1–3 minute submission video. Temporary preview: https://celebrated-cajeta-13e56b.netlify.app (Netlify password shown in the deployment confirmation; expires about one hour after publishing).
