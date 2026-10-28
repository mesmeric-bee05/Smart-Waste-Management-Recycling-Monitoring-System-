# WasteOps Console — Product-Specific Design Override

This override applies to the authenticated operations console and its supporting public request/sign-in forms. It takes precedence over the generated `MASTER.md` wherever they disagree.

## Why the override exists

The generated master is retained as source evidence. Its returned category is “LMS” and its Cormorant Garamond / Crimson Pro academic typography does not describe this civic operations product. Do not apply that unrelated education or library aesthetic. Keep the source skill’s relevant guidance: accessibility is critical, form fields must be labeled, focus must remain visible, interaction states need text and non-color cues, layouts need to work at mobile widths, charts need accessible interpretation, and reduced-motion preferences must be respected.

## Product style

Use a civic-operations control-room aesthetic: precise, calm, trustworthy and field-practical. Treat the screen as a working tool, not a marketing page. Present an information-dense but breathable content canvas beside a persistent dark-teal operations rail. Keep tables, status, traceable timestamps and task actions primary. The map is supporting context and never the only way to use location data.

Use the app’s existing color tokens from `app/globals.css`: pale neutral canvas and surfaces, deep teal brand/rail, high-contrast ink, emerald for positive state, amber for caution and synthetic-data provenance, and crimson only for critical or destructive state. Never convey freshness, severity, source or completion with color alone. Include visible labels such as `SIMULATED`, `STALE`, and `MANUAL SOURCE` where applicable.

Use an Inter-like system sans-serif for interface content and tabular monospaced numerals for IDs, coordinates, units and metrics. Prefer compact uppercase eyebrows and plain sentence-case titles. Keep long-form body copy readable; use a mono face for measures and provenance, not paragraphs.

## Interaction and motion

Forms retain explicit labels, browser validation, field-level bounds and useful server-side feedback. Preserve visible keyboard focus. Destructive actions require deliberate confirmation. Loading/empty/error/success states use concise status text with appropriate live-region semantics. Map activity must have equivalent tabular/list content. Every metric includes units and data window.

Keep motion purposeful and brief (roughly 150–220 ms). No decorative entrance staggers in dense data regions. Reduced-motion users see the finished state immediately. Three-dimensional content remains opt-in, lazily loaded and disposable; it never carries necessary information that is absent from the adjacent two-dimensional/list view.

## Brand treatment

The wordmark pairs the WasteOps name with the custom circular material-flow mark. Personality: calm, accountable, practical. Example microcopy: “SIMULATED sample — no device is connected.” “Review the route order before any real-world use.” The signature color is the deep teal `#0F766E`, used with the existing stronger rail color `#123B36` rather than introducing a separate palette.
