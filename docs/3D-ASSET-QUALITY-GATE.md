# 3D Asset Quality Gate

Non-destructive inspection tool for every `.glb` under `quantaora-app/public/models/`. Built
during "Asset Recovery Wave 1" to validate the new `public/models/sourced/<domain>/` staging
directories that other agents are populating with newly licensed 3D assets, alongside the
pre-existing model tree (anatomy, cells, nature, chemistry, space).

This is a **separate, complementary tool** to `quantaora-app/scripts/check-assets.ts`:

| | `scripts/check-assets.ts` | `scripts/asset-quality/validate-assets.mjs` (this tool) |
| --- | --- | --- |
| Scope | Only assets registered in `src/data/modelRegistry.ts` | Every `.glb` on disk under a root dir, registered or not |
| Purpose | Gate formal integration into the app | Pre-integration triage of staging/sourcing work |
| Checks | License register row, duplicate basenames, required registry metadata, NC-RISK/REVIEW gating | GLB binary validity, scene-graph counts, size/texture budgets, bounding box, content-hash dedup, sourced/** sidecar completeness |

Run both. `check-assets.ts` only ever sees what's already wired into the app; this tool is what
catches problems **before** an asset gets that far — including problems in directories that
`check-assets.ts` doesn't even look at.

## What it checks, and why

For every `.glb` found under the root directory (default `quantaora-app/public/models`):

1. **Valid GLB binary** — magic bytes (`0x46546C67`), version, and that the declared
   total-length field matches the actual file size. Catches truncated downloads and files that
   aren't actually glTF binaries at all (see "Real findings" below — this caught genuine
   S3 `AccessDenied` XML error pages saved with a `.glb` extension during this wave).
2. **Scene-graph counts** — scene/node/mesh/material/texture/animation counts, parsed from the
   glTF JSON chunk. Useful at a glance for "is this the asset I think it is" sanity checks and
   for spotting suspiciously empty or suspiciously huge scene graphs.
3. **File size** — bytes and MB, flagged `WARN` above 15MB (mobile/web delivery budget).
4. **Texture resolution** — dimensions sniffed from embedded image bytes (PNG/JPEG/WebP header
   parsing, no full decode), flagged `WARN` above 2048px on either axis.
5. **Bounding box** — aggregated from each mesh primitive's `POSITION` accessor `min`/`max` (per
   glTF spec these SHOULD be present). Flags `WARN` if any primitive is missing them, so scale/
   framing problems (e.g. a model with a `±32767` bounding box, i.e. still in raw integer units
   with no scale applied — found on `brain.glb`/`eyeball.glb`/`heart.glb` in the existing tree)
   are visible without opening a viewer.
6. **Content-hash duplicate detection** — SHA-256 of the whole file, cross-referenced against
   every other scanned file. This is the primary defense against "same model silently reused as
   unrelated content" (e.g. a generic tree GLB serving both a nature-pack entry and an unrelated
   "Producer"/"Ecosystem" biology component — this is a **real, live finding**, see below).
7. **`sourced/**` provenance sidecar completeness** — for any `.glb` whose path contains a
   `sourced` directory segment, requires an adjacent `<name>.license.json` with `sourceUrl`,
   `creator`/`owner`, `license`, `attributionRequired`, `redistributionStatus`, `dateSourced`,
   `fileSizeBytes`, and `sha256`. Also cross-checks the sidecar's recorded `fileSizeBytes`/
   `sha256` against the actual file (`WARN`/`ERROR` on mismatch — catches a sidecar going stale
   after the asset file was replaced). Pre-existing assets **outside** `sourced/**` are exempt
   from this (they predate the convention); instead the tool checks whether a row exists in
   `docs/ASSET-LICENSES.md` for them, `WARN` if not.
8. **Route-level uniqueness** — same underlying computation as (6), reported as its own summary
   section: any hash appearing more than once anywhere under the scanned root is called out as an
   `ERROR`-level duplicate group, independent of whether the paths look related. The current
   exception is the documented Ecology set-dressing reuse (`producer.glb`/`ecosystem.glb` derived
   from Quaternius tree meshes), which is recorded in `ASSET-LICENSES.md` and the coverage audit
   and now reports as `WARN` instead of failing the gate.
9. **Human-readable report** — per-file findings printed to stdout with `PASS`/`WARN`/`ERROR`
   severities (same vocabulary as `check-assets.ts`), plus a summary section and duplicate-hash
   roll-up. Also writes a timestamped JSON report (and a `latest.json`) under
   `scripts/asset-quality/report-output/` for machine consumption (e.g. by the coverage auditor
   or a future CI step).

## How to run it

From `quantaora-app/`:

```bash
# Default: scan the whole public/models tree (pre-existing + all sourced/** dirs)
node scripts/asset-quality/validate-assets.mjs

# Scan only one domain's staging directory once an agent finishes sourcing
node scripts/asset-quality/validate-assets.mjs --root public/models/sourced/chemistry-reactions

# Scan an arbitrary absolute path
node scripts/asset-quality/validate-assets.mjs --root /absolute/path/to/some/dir

# Skip writing the JSON report file (stdout only)
node scripts/asset-quality/validate-assets.mjs --no-json-report
```

No flags are required to point it at the new `sourced/**` directories from the other 8 agents in
this wave — they live under the default root (`public/models/sourced/<domain>/`), so a plain run
with no arguments already covers them alongside the legacy tree. Use `--root` when you want to
triage a single domain's output in isolation (e.g. right after one agent finishes, before the
others land).

Exit code is `1` if any `ERROR`-level finding exists, `0` otherwise (informational only right
now — see "CI recommendation" below; nothing currently consumes this exit code).

Zero new dependencies: built-ins only (`fs`, `path`, `crypto`) plus the manual GLB parser and
image-header sniffer shipped alongside it in `scripts/asset-quality/lib/`. No `package.json`
changes were made — invoke it directly with `node`.

## Sample real output

Run against the live `public/models` tree during this wave (10 `sourced/**` assets present at
scan time, other agents still writing in parallel — numbers will shift as they finish):

```
Quantaora 3D asset quality gate
Root: /Users/ahmedjawed/Documents/Kids Learning app/quantaora-app/public/models

--- brain.glb ---
  size: 2.45MB  sha256: 2cd5e7178f1e...
  scenes:1 nodes:1 meshes:1 materials:1 textures:3 animations:0
  bbox min:[-32767.000, -30103.000, -26999.000] max:[32767.000, 30103.000, 26999.000]
  texture[0]: 2048x2048 (webp (lossy))
  texture[1]: 2048x2048 (webp (lossy))
  texture[2]: 2048x2048 (webp (lossy))
  PASS

--- sourced/biology-cell/dna-b-form-double-helix-nih.glb ---
  size: 0.00MB  sha256: c8e16e4e94e3...
  ERROR: Invalid/unparsable GLB: Bad magic: expected 0x46546c67 ("glTF"), got 0x6d783f3c.
  ERROR: sourced/** asset is missing its provenance sidecar: dna-b-form-double-helix-nih.license.json

--- sourced/chemistry-reactions/chemistry-lab-bench.glb ---
  size: 3.55MB  sha256: 278ce3248a6e...
  scenes:1 nodes:50 meshes:50 materials:2 textures:6 animations:0
  bbox min:[-0.139, -0.009, -0.079] max:[0.139, 0.420, 0.079]
  texture[0]: 1024x1024 (jpeg)
  ... (3 more textures, all 1024x1024)
  PASS

--- space/bp-tauri.glb ---
  size: 4.41MB  sha256: 368ec13556fa...
  scenes:1 nodes:3 meshes:1 materials:1 textures:0 animations:0
  bbox min:[-4.730, -4.948, -3.868] max:[4.729, 4.948, 3.868]
  PASS

=== Duplicate content hashes (checks 6 & 8) ===
ERROR: hash 122cdd7b6134... is shared by 2 files:
  - biology/ecology/ecosystem.glb
  - nature/quaternius-ultimate-nature/CommonTree_Autumn_1.glb
ERROR: hash d6b976d39175... is shared by 2 files:
  - biology/ecology/producer.glb
  - nature/quaternius-ultimate-nature/CommonTree_1.glb
Note: docs/COVERAGE-AUDIT-2026-08-18.md not found yet -- reporting raw hash collisions only.

=== Summary ===
GLBs scanned: 80 (10 under sourced/**, 70 pre-existing)
Errors: 19
Warnings: 60
JSON report written to scripts/asset-quality/report-output/asset-quality-report-2026-08-17T19-55-15-131Z.json
```

### Real findings from this run (not hypothetical)

- **8 of the 8 `sourced/biology-cell/**` files at scan time were not glTF binaries at all** —
  they are S3 `<Error><Code>AccessDenied</Code>...` XML pages (confirmed by inspecting the raw
  bytes), saved with a `.glb` extension because the download step didn't check the HTTP response
  before writing to disk. All correctly flagged `ERROR: Invalid/unparsable GLB`. These are
  in-flight sourcing failures for the biology-cell domain agent to fix, not something this tool
  should silently tolerate.
- **Two exact-duplicate content hashes** in the pre-existing tree:
  `biology/ecology/ecosystem.glb` is byte-identical to
  `nature/quaternius-ultimate-nature/CommonTree_Autumn_1.glb`, and
  `biology/ecology/producer.glb` is byte-identical to
  `nature/quaternius-ultimate-nature/CommonTree_1.glb`. This matches the pattern described in
  `docs/ASSET-LICENSES.md` ("Derived from CommonTree_1 ... Same license chain") — it's a
  known/intentional reuse of a generic tree mesh as the Producer/Ecosystem diorama base, but it
  is exactly the shape of finding this tool exists to surface for review, whether intentional or
  not.
- **`brain.glb`, `eyeball.glb`, `heart.glb` all have `±32767`-magnitude bounding boxes** — the
  classic signature of geometry never scaled down from raw integer source units. Worth a look
  before these ship as-is; camera framing/hotspot math built assuming metre-scale units would be
  wrong by four to five orders of magnitude.
- `sourced/chemistry-reactions/*.glb` are structurally valid and have complete, cross-checked
  sidecars (their sidecar's `sha256`/`fileSizeBytes` match the actual file) — a working example
  of a domain agent doing the sidecar convention correctly.

## Known limitations

- **No visual verification.** This is a manual GLB container parser, not a renderer — it cannot
  confirm a model looks correct, is framed correctly, has sane materials/shading, or that
  animations actually play back as intended. That still requires either loading the model in the
  app (e.g. via the `run` skill / dev server) or a render-based agent review
  (`quantaora-visual-reviewer` or equivalent). Treat this tool as "did the file survive being
  written to disk intact and is it structurally sane," not "does it look good."
- **Bounding box relies on accessor `min`/`max` being present.** Per spec these should always
  accompany `POSITION` accessors, and every file scanned in this run had them, but a
  spec-noncompliant exporter could omit them; the tool flags that as `WARN` rather than computing
  a box from raw vertex buffers (which would require full accessor/componentType/stride decoding
  — deliberately out of scope for a lightweight triage tool).
- **Texture dimensions only for embedded PNG/JPEG/WebP images referenced via `bufferView`.**
  External URI references (rare in a self-contained `.glb`, but technically legal glTF) are
  reported as "external URI — not embedded, cannot inspect" rather than resolved and checked, so
  as not to introduce a network dependency into a supposedly offline/read-only tool. Unrecognized
  image formats are reported as "unrecognized signature" rather than silently skipped.
- **Single-buffer assumption.** Only images/geometry living in buffer index 0 (the embedded BIN
  chunk, the standard case for a self-contained `.glb`) are inspected; a file referencing
  additional external buffers would report those bufferViews as unsupported rather than erroring.
  Every file in this run used a single embedded buffer.
- **Duplicate-hash detection is exact-byte-identical only.** It will not catch near-duplicates
  (same source model re-exported at different scale/compression, or a lightly retextured copy).
  That class of "conceptually reused" finding needs either manual review or a perceptual/geometry
  similarity pass, which is out of scope here.
- **`docs/COVERAGE-AUDIT-2026-08-18.md` did not exist as of this tool's build/test run.** The
  script checks for it and prints a note either way; when it lands, cross-reference its findings
  against the "Duplicate content hashes" section above manually — this tool does not attempt to
  parse an unknown-format audit document.

## CI recommendation

**Stays a manual pre-integration check for now.** Reasons:

- The 8 sourcing agents are actively writing to `sourced/**` mid-wave; wiring this into CI today
  would fail every PR touching `public/models/` until sourcing finishes and sidecars are
  backfilled (see the biology-cell `AccessDenied` files above — those need re-sourcing, not a CI
  bypass).
- It has zero coverage of the actual product-facing requirement (does the asset look right in
  the app) — it's a necessary-but-not-sufficient gate. Pairing it with a render-based visual
  check before flipping on CI enforcement would catch a fuller class of problems in one gate.
- No `package.json` script was added this wave (out of this agent's ownership), so there's no
  existing `npm run` entry point to wire into a workflow yet.

**Promote to CI once**, in this order: (1) all wave-1 sourcing agents have finished and every
`sourced/**` asset has a complete, hash-verified sidecar; (2) the coverage auditor's findings are
cross-referenced against the duplicate-hash groups here and resolved or explicitly accepted; (3)
someone adds an `assets:quality` script to `package.json` (not done here — out of this agent's
ownership this wave) that runs `validate-assets.mjs` and treats its exit code as a gate, mirroring
how `assets:check` already gates `PAID_RELEASE`. At that point it slots naturally next to the
existing `npm run assets:check` step.
