# SANA NEXT

Self-contained German presentation and connected practice simulator at `/vision/`.

- Start with **Die Zukunft erleben** for a guided, manually paced demonstration or **Frei entdecken** for chapter navigation.
- Accept the fictional call, finish the transcript and hand off the request.
- Select an available alternative, confirm professional review and patient consent, then reserve the example slot.
- Release the fictional intake from the phone, approve it as reception and open the doctor view.
- The command center derives its counts from those exact actions. Baseline: 11 occupied slots out of 18.
- Explore the CSS 3D rooms or technology list in SANA 2028. Reset clears all example actions.
- Optional German speech uses the browser's speech synthesis, with a readable transcript fallback. Voice availability/quality depends on the browser. No microphone is used.
- Arrow keys navigate scenes when focus is not on a control. The page respects reduced motion and supports keyboard controls and native dialogs.

All patient, profile, availability and operational data are fictional. Dr. Wickler is named only as the requested physician in an explicitly fictional calendar. No medical diagnosis, automatic triage or real booking occurs. There are no API calls, persistence, real integrations or database changes. Existing intake and administration routes are untouched.

## Checks

`npm run check` and `npm test` include syntax and model checks. Manual browser QA covered the complete guided desktop journey and a 390px mobile-frame viewport (375px content width with scrollbar), including callback completion, incompatible follow-up filtering, intake release, dialogs, navigation and reset. This is responsive browser testing, not physical iOS/Android device testing.

Cloudflare Pages continues to deploy `public/` through the existing repository connection. No dependency or build command is needed.
