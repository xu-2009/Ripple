# Congressional App Challenge — Ripples submission prep

Status: working draft for the student team. Confirm every bracketed team detail and the official submission prompts before using any text in the final entry.

## Short project description

Ripples is a mobile-first Utah household water and electricity conservation app. It helps people enter monthly utility bills, compare usage across different billing periods, see trends, and try practical conservation actions. The app distinguishes measured bill history from estimates and clearly marks fictional county examples.

## Draft written answers

### What is original about the project?

Ripples brings household water and electricity bills, billing-period normalization, Utah source-based context, and action simulations into one mobile-first experience. It converts water units, accounts for billing days, and keeps estimates separate from actual bills. Explore Utah uses official county boundaries while its sample community activity is clearly labeled fictional. The goal is to make the limits of a comparison visible, not to imply a household is being ranked using real county utility data.

### How does it benefit the community?

The app gives Utah households and students a practical way to notice their own resource-use patterns and explore small conservation steps. It explains what a bill comparison can and cannot show, and it avoids presenting fictional county data as measured community savings. Future real community reporting would need voluntary, reviewed submissions and minimum group-size privacy protections before any regional totals are shown.

### What coding challenges did the team address?

The project handles different water units, bill periods with different numbers of days, duplicate months, invalid values, and gaps in a household's history. It keeps bill records separate from scenario estimates and forecasts. The team also worked through county-map interactions, responsive mobile layouts, motion preferences, and privacy rules for any future shared reports.

### How was AI used?

AI tools assisted with implementation, debugging, documentation, and automated checks. The student team set the product direction and requirements, reviewed the behavior, and tested the app. AI-generated code and text were not treated as proof that the app works: the team ran browser and calculation checks and labeled limitations. Before submission, the team should name the tools used and describe its own review and changes accurately.

## Team contribution details — confirm before final use

- Hongwen Xu: product direction, feature decisions, partner coordination, and hands-on review/testing. Confirm or edit this description.
- Partner: [add the partner's name and the work they personally completed: requirements, design, research, coding, testing, or presentation].
- Shared work: [confirm which research, coding, review, and presentation tasks were shared].

Do not submit the bracketed text. Attribute work only to the teammate who actually completed it.

## 90-second demo video outline

1. **0:00–0:10 — Problem and audience.** Introduce Utah households trying to understand monthly water and electricity bills.
2. **0:10–0:27 — Import bills.** In a clean demo account, import a fictional CSV and show the review step, duplicate handling, and explicit fictional-data label.
3. **0:27–0:42 — Trends.** Switch between water and electricity and show the graph changing. Point out that daily averages account for different billing periods.
4. **0:42–0:57 — Action estimate.** Adjust the shower simulator and explain that its result is an estimate based on the entered assumptions, not measured savings.
5. **0:57–1:12 — Utah map.** Tap a county, show its detail and top-five demo view, and state that demo counts are fictional while official-source context is separate.
6. **1:12–1:30 — Technical choices and team.** Briefly explain browser-local bill storage, privacy limits, AI assistance, and each teammate's confirmed contribution.

## Current footage

A 76-second silent MP4 and source WebM are available in `deliverables/`. The footage uses the fictional 2025 bill sample, imports two invented bills, shows the graph, simulator, Utah county map, and Home. It is a visual draft; the student team still needs to review it, record narration, and verify each teammate's contribution before final submission. Recreate the WebM with `scripts/record-demo.cjs` when the local server is running.

## Recording checklist

- Use a fresh browser profile or clearly fictional demo data; do not show a real bill, email, account identifier, API key, or private dashboard.
- Show the import preview before confirming it; keep the fictional sample label in view.
- Capture bill import, a graph update, the simulator result, and one county tap.
- Use a phone-sized view with readable text; record voice-over only after the team confirms the script and contributions.
- Review the exported video for private data, legibility, and a 1–3 minute duration.
