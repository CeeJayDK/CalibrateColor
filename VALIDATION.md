# Version 1 validation

Validated on 15 November 2026.

## Automated checks

`npm test`: 8 tests passed. The tests verify exact rendered pixel samples for the black/white patches, all 17 grayscale steps, every 8-bit gradient value, one-pixel sharpness textures, checkerboard alternation and the sRGB / pure-gamma midpoint distinction. The sRGB toe and endpoints are also checked.

`node --check` passed for the application, content, renderer and development server.

## Interactive browser checks

Checked in the provided desktop Chromium browser:

- Preparation checklist, start button and navigation through all six patterns to the final review.
- Progress surviving a reload, individual checked indicators and reset walkthrough.
- Switching to direct pattern access; the first pattern's Previous button is disabled.
- Label toggle, keyboard pattern switching and Escape exit from the expanded viewer.
- In-page fullscreen fallback, clearly labeled when native fullscreen was unavailable.
- Hide Controls removes the overlay; navigation preserves the expanded pattern view.
- About dialog, Escape dismissal and rendered pattern / instruction layouts.

The finished preparation screen and representative black-level, gamma and sharpness views were visually inspected. Browser-extension metadata errors were present in the environment's log; no application error was observed during these checks.

## Still needs hardware / browser coverage

Native browser fullscreen could not be exercised in this environment; the denied-fullscreen fallback was exercised instead. Firefox, Safari, fractional display scaling, multiple physical displays and actual TV signal paths have not been tested. The responsive CSS is implemented, but no separate mobile-device test was performed.

No colorimeter, physical panel or GPU output capture was available. These checks establish source pixel values and application behavior, not end-to-end display accuracy. GitHub Pages branch deployment will be checked separately once enabled in repository settings with `main` and `/ (root)`.

## Branch deployment layout

The website files were moved unchanged from `public/` to the repository root. The test import and development server root were updated, and the deployment workflow was replaced with a test-only workflow. All eight pattern tests and JavaScript syntax checks passed after the move.
