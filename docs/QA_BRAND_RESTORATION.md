# Brand restoration and usability QA

## Final direction

The owner's supplied screenshot is the visual authority. The interface restores navy navigation, lime active selection, navy primary actions, a cool grey canvas and white summary/service panels. The supplied logo remains unchanged. Shared typography, clearer table spacing and usable phone controls accompany the restored palette.

The final implementation is a presentation change in `public/tokens.css`, `public/styles.css` and the overview wrapper/logo dimensions in `src/app.js`. All nine routes, field names, handlers, links, figures, records and storage boundaries are retained. The source changes introduce no new business logic or dependencies.

## Evidence

- Final desktop colours measured in the browser: sidebar RGB 16/45/83, active destination 132/194/37, primary action 15/52/110, summary surface 254/255/255. These match the original logo/reference scheme.
- All nine destinations were inspected in the real browser. The overview's before/after inventory of links, actions, fields, headings and figures matched exactly. The logo now declares its natural 1052 by 384 dimensions without changing its pixels or aspect ratio.
- All four calendar modes retain equal 720-pixel desktop frames. At measured 1920-pixel viewport width, document width was 1905; the canvas remains capped at 1440 pixels. At 375 pixels, each calendar mode's document width was 360, with no page overflow.
- The selected-day button still fills its footer. Before palette restoration, date selection retained scroll at 456.43 pixels before/after; the subsequent palette-only change leaves that behaviour untouched.
- Phone ledger columns retain the client identity, payment standing and a 44-pixel row action without horizontal table overflow: final table scroll width and inner width were both 326 pixels. Dense non-overview tables retain their own horizontal scrolling regions.
- A positioned table scroll region prevents offscreen accessible labels from enlarging the document. Calendar, row and tab focus rings are inset; recent-report focus remains visible. Navigation collapses to its existing menu at 960 pixels, and summary metrics use two columns below 1100 pixels.
- The client contact form was opened and cancelled in browser QA. Its fields fit the narrow viewport and use 16-pixel text. No edit was saved. No browser or database records were reset during this task.
- Browser warning/error log was empty. General Sans and the original logo loaded successfully.

## Checks and review

- `npm test`: 39 passed, zero failed or skipped. Business/domain code is unchanged.
- `npm run check` and `git diff --check`: passed.
- Hallmark app static sweep: zero Floor failures. Existing compact optical-spacing waivers remain. The repeated white-panel Finish finding is answered explicitly because the owner reference uses that containment pattern.
- Final token-pair contrast checks passed: navy/white 12.07:1, body ink/canvas 13.26:1, muted/white 5.19:1, sidebar text/navy 12.82:1, sidebar secondary text/navy 8.76:1 and dark text/lime selection 6.91:1.
- Taste static sweep: zero failures; existing ISO-date padding and real overlay-shadow warnings remain intentional.
- Independent Hallmark finish review: **ship** for the final desktop and phone screenshots; no palette or contrast defect found. This is a visual verdict, separate from the behaviour checks above.

Native browser screenshots replace the scripted render tier. Full-page capture timed out; no raw-CDP retry or stitched image was used. Early emulated screenshot exports were distorted and were discarded. Final captures were taken with the viewport stable. Browser zoom can change the relation between requested and measured dimensions; measurements above are actual CSS viewport values.

## Final captures

- [Restored overview](screenshots/brand-restored-overview.jpg)
- [Restored calendar](screenshots/brand-restored-calendar.jpg)
- [Phone overview and ledger](screenshots/brand-restored-phone.jpg)
- [Before/after comparison](../.hallmark/compare.html)

Physical-phone, screen-reader and print acceptance were not performed. The UI remains browser-local; this change does not connect it to the local PostgreSQL API or deploy anything hosted.
