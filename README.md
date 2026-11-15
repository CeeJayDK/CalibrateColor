# CalibrateColor

A free, open-source webpage for visually adjusting SDR monitors and TVs using their own controls. English, beginner-friendly instructions with optional technical explanations. No build step, framework, analytics, remote fonts or runtime dependencies.

## First version

- Guided preparation, six-step walkthrough and final review.
- Direct access and shareable links to black level, white level, gamma, grayscale, gradients and sharpness patterns.
- Fullscreen viewing; controls hide after 3.5 seconds, or immediately with H. Move the pointer, tap the pattern or press Tab to restore controls. An in-page fallback is labeled when browser fullscreen is unavailable.
- Backing-pixel canvas rendering in sRGB. Fine textures use individual backing pixels even on high-DPI displays. Labels can be hidden.
- Optional local checklist and checked-pattern progress. No measurements, profiles or display settings are saved or changed.
- Responsive layout, keyboard navigation, native dialogs and reduced-motion support.

### Run locally

Serve `public/` with any static HTTP server. For example, from this repository:

```sh
npm run dev
# http://localhost:5173
```

The development server and dependency-free tests need Node.js 22 or later. No npm installation is required:

```sh
npm test
```

### GitHub Pages and CeeJay.dk

1. Commit these files to `main`, or merge an implementation branch. Preserve the directory structure: the website is in `public/`, and the deployment workflow is in `.github/workflows/`.
2. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
3. Run the included Pages workflow, or push to `main`. Only `public/` is deployed.
4. GitHub provides the project URL, normally `https://ceejaydk.github.io/CalibrateColor/`.
5. When the desired CeeJay.dk address is decided, configure it in GitHub Pages and set the matching DNS record. A subdomain such as `calibrate.ceejay.dk` can point to `ceejaydk.github.io`. Alternatively serve the files in `public/` from a path on the existing CeeJay.dk website.

No custom domain is configured by this change. Asset paths are relative, so the page supports a project subdirectory or a domain root. Hash routes do not require server rewrite rules. For a direct link, use e.g. `#patterns/black`.

### Keyboard

| Key | Action |
| --- | --- |
| Left / Right | Previous / next step; in fullscreen, previous / next pattern |
| F | Toggle fullscreen pattern |
| H | Hide / show fullscreen controls |
| L | Toggle pattern labels |
| Esc | Leave fullscreen or close a dialog |
| ? | Show keyboard shortcuts outside fullscreen |

### Rendering and limits

All values are full-range 8-bit sRGB (0–255). They are not limited-range video (16–235), HDR, or 10-bit test signals. The browser, OS display profile, GPU LUT, output range, scaling and TV processing remain part of the signal path. The page cannot inspect or bypass them. Canvas `devicePixelRatio` sizing does not prove 1:1 physical panel mapping.

Gamma is an approximate visual midtone comparison: a one-pixel 50% black/white checker around a solid patch. sRGB uses its piecewise transfer function (half linear-light intensity rounds to code 188); a separate pure 2.2 target rounds to 186. Reference: [sRGB interpretation for ICC profiles](https://www.w3.org/Graphics/Color/srgb). A single match does not establish the full display response curve. Native resolution, no scaling and neutral sharpening matter.

Black patches are 0–32 on black. White patches are 223–255 on white. Grayscale has 17 steps. Gradients contain all 256 encoded values when wide enough; fine 8-bit stepping is expected. Sharpness uses one-backing-pixel textures and a 64/192 edge reference. All patterns are generated in code; no third-party test images are included.

The tool does not measure luminance, validate D65, measure gamut, generate an ICC profile or a LUT, or certify calibration. Use a colorimeter and appropriate calibration software for that work.

MIT licensed. See [LICENSE](LICENSE).
