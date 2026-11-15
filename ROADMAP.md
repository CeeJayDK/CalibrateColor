# Ideas for version two

The first version deliberately focuses on visual adjustment in desktop browsers, SDR / sRGB, and six core patterns. These are proposals, not promises or implemented features.

## First priority: refine the existing patterns

1. **More useful gamma checks.** Add separately labeled 25%, 50% and 75% linear-light references, each with appropriate checker duty cycles, to reveal more of the tone curve. Test susceptibility to inversion, local dimming and scaling on actual displays before presenting them as useful estimates.
2. **Alternative shadow/highlight views.** Offer a selectable subset with larger patches, plus optional manual flashing for visibility comparisons. Keep static patterns the default and label how temporal processing can affect flashing.
3. **A better record of adjustments.** Optional local notes per display/input/preset, before/after settings and a downloadable summary. Record user observations rather than inventing accuracy scores.
4. **More browser and hardware testing.** Check Chromium, Firefox and Safari, fractional OS scaling, multiple monitors and actual LCD/OLED TVs. Add browser regression coverage for fullscreen, denied fullscreen, restricted storage, history and keyboard focus.

## Next useful additions

- An optional quick pass through the walkthrough, with the current detailed instructions still available.
- Danish translation, with a small language selector and independently reviewed terminology.
- Locally downloadable, lossless sRGB PNG patterns with documented pixel dimensions and color metadata. Warn against image viewers that resize them.
- A small optional diagnostic section for 1:1 mapping and 4:4:4 chroma; distinguish signal-path checks from calibration.

## Research before expanding scope

HDR, wide-gamut, automatic display control and instrument integration need their own explicit designs and verified browser/device capabilities. Do not add a generic “HDR” switch to these SDR patterns or infer HDR output from display capability queries.

No synthetic white-point picker: an unmeasured screen cannot be its own reliable D65 reference. No sliders that merely alter the webpage while implying that the display has been calibrated.
