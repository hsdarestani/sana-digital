# Sana Digital – digitale Patientenaufnahme

Responsive German-language patient intake for **Sana MVZ Orthopädie und Chirurgie Frankfurt-Westend**, designed for Cloudflare Pages and Cloudflare D1.

## SANA NEXT: presentation edition, 3 November 2026

- `/vision/`: blue-and-white presentation with exactly two one-tap entries: A+ Solution's **human-operated telephone service** and digital patient intake. Native links open both sample PDFs reliably in a new tab.
- `/vision/hotline/`: all original employee fields and conditional requests; full live summary, optional local PIN simulation and a branded, searchable A4 PDF. Changing caller details invalidates a previously confirmed demo PIN.
- `/?demo=1`: the existing five-step intake in a **forced, non-submitting presentation mode**, regardless of the server's activation setting. The example button inserts fictional data; consent boxes and signature are never prefilled. `/` retains the existing production activation checks.
- Both PDF exports use the same local vector layout engine, embedded German-capable fonts, complete answers, repeated section headers, signature/review area and page counts. Large answers and long tokens wrap over as many A4 pages as needed. No answer-length truncation.
- Downloads provide persistent **PDF öffnen** and **PDF erneut herunterladen** links for Safari. PDF generation fetches only static, same-origin fonts and branding; form data is never sent by the export.
- Existing backend, D1 encryption, Access checks, activation controls and CSP are unchanged. SMS, document delivery and calendar access remain clearly marked simulations. No real-patient collection has been activated.
- German handover: [Änderungsbericht und QA](docs/Aenderungsbericht_DE.md).

### Verification and sample generation

```sh
npm ci
npm run check
npm test
npx playwright install --with-deps chromium webkit
npm run test:journeys
npm run samples
```

Browser tests run the shipped files and CSP through offline request interception in real Chromium and WebKit engines. They perform no external writes. The matrix covers desktop, Android, iPad portrait/landscape and iPhone. This is browser/device emulation, **not a physical iPad or native Safari hardware certification**. The standard GitHub quality workflow runs the same tests and keeps fictional QA artifacts for three days.

Generated samples live in `public/assets/`. Their data and creation date are deliberately fixed and fictional. The `.pdf` files can be regenerated with the same browser PDF engine through `scripts/generate-samples.mjs`.

## Included
- Five accessible, mobile-first steps: personal/insurance/contact, medical history, privacy/optional billing consent, optional independent IGeL decision helper, review + touch signature.
- IGeL patient education is voluntary, with no price list, booking, purchase or clinical rehabilitation protocol included.
- Separate **opt-in** for external billing by Ärztliche Verrechnungsstelle Büdingen GmbH; refusing cannot block submitting patient data.
- Submission via Pages Function to **AES-256-GCM encrypted D1 record**, minimal unencrypted metadata. **Preview-only by default**; production storage requires explicit activation.
- Restricted staff dashboard in /admin with verified **Cloudflare Access** JWT for listing, detail and status updates. No public read API.
- No localStorage, no analytics, no remote fonts, no plaintext personal data logged.

## Important: NOT production-ready for real patients until prerequisites are completed
This repository alone does NOT create Cloudflare resources or grant approval for processing real patient health data. Before collecting real patient information:
1. Have the actual healthcare controller / DPO verify the full Datenschutzinformation, legal bases, processor agreements (AVV/DPA with Cloudflare), retention/deletion policy, medical confidentiality and practice operating procedures. Current privacy dialog is a **placeholder/short summary**, not the legally finalized notice.
2. Restrict access to the Cloudflare account, backups and D1; enforce staff MFA and least privilege.
3. Protect both **/admin*** and **/api/admin*** with a Cloudflare Access application, restricted to authorized staff. Set ACCESS_TEAM_DOMAIN and ACCESS_AUD; API additionally verifies Cloudflare-signed JWT cryptographically.
4. Add bot/rate limiting via Cloudflare WAF and optionally Turnstile. Confirm data-residency and audit/logging choices with the controller.
5. Test consent wording with practice/legal representative, as well as signature acceptance, minors and accessibility.

## Existing deployment: finish D1 setup (sana-digital.pages.dev)

If the Pages project and D1 resource already exist, **do not recreate either**:

1. Verify Pages project → Settings → Bindings → Production D1 binding name is exactly `DB`, with the selected existing database. After changing it, **redeploy**.
   **Sensitive health data:** confirm the existing database has EU jurisdiction (`eu`). Cloudflare documents that jurisdiction can only be set at D1 creation time, not retrofitted later. A simple western-Europe location hint is not the same as an EU jurisdiction guarantee. If jurisdiction is wrong, create a correctly located replacement **before** any patient submissions and bind that instead.
2. Open the existing D1 database in Cloudflare Dashboard → Console, and apply the statements in [migrations/0001_init.sql](migrations/0001_init.sql) to that database. Creating a D1 resource or binding does not create the `intakes` table.
3. In Pages → Settings → Variables and Secrets (Production), add `DATA_ENCRYPTION_KEY` as a **secret**, 32 random bytes in base64. Never share it in chat or push it to Git.
4. Before enabling real submissions, have the controller/DPO approve consent wording, privacy notice, retention and access policies. The current privacy dialog is only a short placeholder, so keep preview enabled until approved.
5. Restrict `/admin/*` and `/api/admin/*` with two Cloudflare Access path rules, leaving `/` and `/api/submit` public. Save `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` as Pages environment variables. A Cloudflare Access policy protecting the **entire** Pages hostname would block patients; never turn on that global option for the patient-facing form.
6. Recommended: add Cloudflare Turnstile site key and secret, WAF rate limits and MFA for staff. Add `INTAKE_ENABLED=true` **only after these checks are complete**.
7. Redeploy the production project after modifying Bindings/Variables. Visit [the public configuration endpoint](https://sana-digital.pages.dev/api/config): `{"enabled":false,...}` means the site is **still in preview**. The API now verifies **D1 table existence, key format, Turnstile configuration and activation flag**; `true` means these technical prerequisites are present, **not** that legal approval is complete.
8. Using strictly fictional test data, test one end-to-end submission and confirm it appears at `/admin/` only to authorized staff. Do not send real patient data until the privacy and security review is complete.

### Troubleshooting

- `/api/config` shows `enabled:false`: one or more activation prerequisites have not been met. Verify the migration, binding name `DB`, secret format, optional Turnstile pair, and `INTAKE_ENABLED` flag. No secret values are returned to visitors.
- `/admin/` opens but cannot list patients: check **both** Cloudflare Access path policies and `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD`; a public static admin HTML page is not proof of authentication.
- `/api/config` returns `true` but submit fails: review deployment Functions logs **without exposing request data** and verify permissions, D1 environment (Production vs Preview), and schema version.

## Deploy to Cloudflare Pages
Cloudflare Pages → Create project → Connect to Git → select this repo.
- Framework preset: **None**
- Build command: **leave blank**
- Build output directory: **public**
- Root: repository root
- Pages Functions are auto-discovered from /functions.

### D1
Create a D1 database named **sana-digital-patients** through the dashboard (Workers & Pages → D1) or use:

```sh
npx wrangler d1 create sana-digital-patients
npx wrangler d1 execute sana-digital-patients --remote --file=migrations/0001_init.sql
```

In Pages → your project → Settings → Bindings, add D1 database binding with the exact variable name **DB**, choose **sana-digital-patients**, apply for Production (and separate Preview DB if testing); **redeploy** for changes to take effect. For local development, wrangler can bind a separate local D1.

### Secret configuration (Pages → Settings → Variables and Secrets)
- **INTAKE_ENABLED** (required for live patient submissions): use `true` ONLY after all legal, clinical, technical, access and data-protection approvals. Defaults to a non-submitting **preview mode**.
- **DATA_ENCRYPTION_KEY** (required, SECRET). Generate a cryptographically random, 32-byte base64 key using e.g. `openssl rand -base64 32`. Store securely OFF-repo, with recoverable backup. **Loss of key makes all stored submissions permanently unreadable. Never rotate without re-encrypting existing records.**
- **ACCESS_TEAM_DOMAIN** (required for admin), e.g. `your-team.cloudflareaccess.com`.
- **ACCESS_AUD** (required for admin) from your Access app JWT Audience tag.
- **TURNSTILE_SITE_KEY** (recommended): public key for Cloudflare Turnstile, returned by the safe `/api/config` endpoint to render the widget.
- **TURNSTILE_SECRET** (recommended, SECRET): Cloudflare Turnstile server-verification secret. Configure BOTH site key and secret for production. If the secret is set without a working widget, submissions are intentionally rejected. Also configure Cloudflare WAF rate limits.

Never put live credentials, patient data or D1 backups in GitHub. Public source code is okay; use Cloudflare secrets for values.

### Admin
After securing Cloudflare Access policies, visit **/admin/**. The UI communicates with /api/admin/records. Without valid signed Access JWT claims, the API returns 401; without D1/key setup, it returns 503. Review records, inspect consent and signature, print as needed and mark a record as reviewed / archived. D1 status "archived" does not delete it.

### Local development
```sh
npx wrangler pages dev public --d1 DB=local-d1
npx wrangler d1 execute local-d1 --local --file=migrations/0001_init.sql
```
For actual local testing set `DATA_ENCRYPTION_KEY` in `.dev.vars` (gitignored); do not use a production key.
If invoking Wrangler with a Pages config, see official Cloudflare docs for your version.

## Retention
Encrypted records are **not auto-deleted**. Configure a documented retention/deletion and backup policy BEFORE go-live. To delete records, use an authorized admin procedure or D1 with strict access; archiving is not deletion. Audit changes and patient data access outside of the app as required by the operator.

## Source documents
The patient intake and external-billing information were adapted from photographed German forms supplied by the operator. The uploaded IGeL price list and SLAP rehabilitation sheet have been deliberately removed from the patient application. Clinical and legal texts still require approval before use.

## IGeL patient decision guide (source document)

The optional decision helper in Step 4 is a condensed, clearly attributed adaptation of the uploaded source: Bundesärztekammer / Kassenärztliche Bundesvereinigung / Deutsches Netzwerk Evidenzbasierte Medizin, **Selbst zahlen? Ein Ratgeber zu Individuellen Gesundheitsleistungen (IGeL)**, 2nd ed. November 2012, last changed January 2014. Source sections: patient checklist pp. 9–16, professional guidance pp. 29–30, sample treatment agreement p. 31.

- Explains voluntary nature, evidence and risk discussion, alternatives, costs, second opinions, adequate time, no obligation to buy, GOÄ invoice and separate written agreement.
- Offers **nine optional browser-only questions** before deciding; the source's tenth question applies **after** treatment and is displayed as advice only.
- No checklist responses are transmitted, retained, or included in D1. No medical advice, service selection or payment is generated.
- **The PDF is historical (2012/2014)**; its legal or medical statements have NOT been revalidated for current practice and need clinical/legal review before real-patient use. IGeL pricing and the SLAP rehabilitation sheet have been deliberately excluded from the patient application.

## Digitaler Sichtbarkeits-Check (03.11.2026)

The separate German presentation at [`/vision/sichtbarkeit/`](https://sana-digital.pages.dev/vision/sichtbarkeit/) is linked from SANA NEXT. Seven chapters cover public Google observations, three local competitors, concrete website findings, an explicitly labelled design concept and a 30/60/90-day roadmap. The optional guided tour advances every eleven seconds and pauses on interaction or when the tab becomes hidden.

- [Readable evidence report](https://sana-digital.pages.dev/vision/sichtbarkeit/belege.html), with dated methods and limitations for every record.
- [Tracked German source report](docs/sichtbarkeit/Quellenbericht_DE.md), also downloadable as Markdown from the presentation.
- Raw public Google lists: `public/vision/sichtbarkeit/google-stichprobe.json`; five-page HTTP/HTML sample: `website-pruefung.json`.
- The Google snapshots use `hl=de`, `gl=de`, `pws=0`, with an unknown precise location. They are **not** Frankfurt-pinned or durable rankings. Positive doctor/directory appearances remain in the report.
- There is no authorized Search Console, Analytics or Business Profile performance dataset; no verified search volumes, traffic, conversions, patient/revenue estimates or usable Core Web Vitals scores are asserted.
- Website images are documented renders of original public resources, checked against the live browser. The concept does not modify the official practice website. Google screenshot export was unavailable and is not represented as an archived image.

The new section performs public, same-origin GET requests only. It introduces no analytics, storage, patient collection or operational integrations. Backend, encryption, activation gates, admin authorization, intake fields and PDF generation are preserved. A Safari validation issue in the hotline demo is corrected with accessible inline guidance instead of native validation bubbles.

Validation: `npm run check`, `npm test`, `npm run test:journeys`. Browser coverage includes desktop and Android Chromium, iPad WebKit in both orientations and iPhone WebKit. These are device emulations, not physical Apple-device testing. See [German handover](docs/sichtbarkeit/Aenderungsbericht_DE.md).
