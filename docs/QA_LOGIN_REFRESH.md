# Login refresh from supplied references

## Direction and source review

The owner requested a better login layout using the PDFs in `reference/`. Both decks were inspected: the eight-page company profile establishes pest/pathogen management and protective-clothing imagery; the ten-page presentation includes field/site-visit photographs. The existing navy/lime logo system and General Sans remain authoritative.

Taste's app-screen workflow dealt editorial-greeting and achromatic-ledger. Editorial-greeting was chosen for its clear greeting, centered form measure and flat surfaces. The sign-in screen adapts that composition to a two-column entry screen rather than adding dashboard metrics or navigation. The product-specific element is the site-visit photograph supplied in the company's own presentation. The form answers one question: which demo workspace account should the viewer enter?

The layout pairs a white sign-in panel with a three-photo collage and navy caption panel. A dominant site-visit image sits above smaller hygiene-swab and silo-work photographs. Narrow layouts put the form first and stack the collage below. A one-time 520–620 millisecond fade/8-pixel entrance gives restrained movement, with an 80/160 millisecond photo stagger and no loops. Reduced-motion preference disables it; the form never waits for a motion-triggered action. The original logo is unchanged. Controls have explicit labels, 44-pixel minimum fields, a 48-pixel primary action and existing focus styles. The five demo roles can populate public credentials through a selector; selecting a role does not sign in or bypass activation checks. Manual entry and the credential table remain available. No authentication/backend behavior changed.

## Image provenance

| Source | SHA-256 |
| --- | --- |
| `reference/Zealpro Solutions, Inc. Company Profile v2.pdf` | `878eb37313b4369da11c35443a6eb74fd5924b9558123ff7e51dd0a6da9f2ee6` |
| `reference/ZEALPRO_20PRESENTATION_202025_20(2).pdf` | `83559e8a2ec9e8854bba94a4b0725d3c9ac365be7c00a7e47115228f24a64266` |
| `public/assets/zealpro-field-visit.jpg` | `d7f6828fbe9f51aacdb1882ca77399b464d64442aa262aa9675d8e1775821683` |

All three published JPEGs are unaltered image extractions: the main image is xref 556 on page 8 (2048 × 1536, 926,075 bytes); hygiene inspection is xref 381 on page 6 (701 × 1228); silo work is xref 384 on page 6 (768 × 1024). Their exact hashes are recorded in `SOURCE_MANIFEST.json`. No image generation, retouching or composited staff were used. CSS controls framing and collage placement. The owner supplied these references and explicitly requested photo reuse; independent copyright ownership was not established. The page identifies the company presentation as its source. Full PDFs remain unchanged, Git-ignored and outside the static allowlist; only these three photographs are published.

## Checks

- Full existing suite: 90 tests passed. The template/controller harness additionally checks the image path, original sign-in form and sample-role selection populating the correct public email/password without authentication.
- Syntax, build and whitespace checks passed. The browser artifact now contains 17 files, including the three photos. Hosting tests verify byte identity and exclude private files; local HTTP tests include all three images and deny both reference PDF URLs.
- Hallmark app static scan: zero failures/reflexes/warnings; existing spacing waivers and answered Finish findings retained. Taste scan: zero failures; five existing overlay/date warnings.
- Independent source review found no Important/Critical issues in control wiring, role preservation or static exposure. Its focused policy/template/hosting checks passed 16/16. Collage re-review identified an intrinsic portrait-image sizing risk: image frames now own layout with absolutely positioned photos, preventing source ratios from inflating desktop rows. Current visual acceptance is recorded separately below.

## Browser limitation

The in-app browser was unavailable. Brave's extension bridge failed navigation. Native Computer Use was then stopped because it could not identify the Windows browser URL safely enough to enforce policy. No further Computer Use or alternate browser automation was attempted. Consequently this change has no verified current screenshot, measured mobile layout, visual inspection or browser interaction pass. Source/controller/static checks do not replace that acceptance.

The existing demo remains browser-local with public role presets, not production authentication. Owner records, local database and backend business modules were not reset or changed.

## Hosted acceptance

Implementation `3441314` was pushed directly to main. All seventeen browser assets match committed Git blobs on `https://zealpro-demo.vercel.app/`, including the three JPEGs, with HTTP 200 and suitable content types. Private/API paths, both requirements PDFs and both company reference decks return 404; configured security headers remain present. An initial check preceded deployment completion; the later check matched all files. The disposable loopback preview on port 4496 was stopped. This is HTTP/artifact acceptance; the browser visual limitation above remains.
