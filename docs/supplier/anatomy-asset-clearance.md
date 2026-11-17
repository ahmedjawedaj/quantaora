# Anatomy Asset Clearance Queue

Status: active P0. Last updated 2026-08-12.

The anatomy lab is the product quality reference. These nine GLBs are intentionally preserved as
the visible quality baseline, but they are not paid-release safe until provenance is recorded per
file or a replacement with equal/better visual quality is imported.

## Clearance Standard

Each anatomy asset needs this evidence before it can move from `REVIEW` to `CLEAR` or `ATTRIB`:

- exact source URL or purchase/download receipt;
- licence text captured at time of download;
- commercial-use permission;
- permission to redistribute inside a web app bundle;
- derivative/editing permission, including decimation and material changes;
- required attribution text, if any;
- original/source files when available (`.blend`, `.fbx`, `.obj`, textures);
- screenshot QA proving no canvas clipping on desktop and mobile;
- updated rows in `docs/ASSET-LICENSES.md` and `quantaora-app/src/data/modelRegistry.ts`;
- `npm run assets:check` green and `PAID_RELEASE=1 npm run assets:check` no longer blocked by
  the cleared file.

## Work Order

Do not replace an anatomy organ with a weaker mesh just to close a licence warning. If evidence
cannot be found, source a premium/commercial-safe replacement that meets or exceeds the current
anatomy visual bar.

| Priority | Component | Current file | Size | Current status | Target outcome | Notes |
| --- | --- | --- | ---: | --- | --- | --- |
| 1 | Heart | `public/models/heart.glb` | 3.2 MB | REVIEW | CLEAR or ATTRIB | Highest demo value; source first because it anchors biology quality. |
| 2 | Lungs | `public/models/lungs.glb` | 4.2 MB | REVIEW | CLEAR or ATTRIB | Pair with breathing/physiology interactions later. |
| 3 | Brain | `public/models/brain.glb` | 2.5 MB | REVIEW | CLEAR or ATTRIB | Second biology hero after heart/lungs; needed for neuroscience path. |
| 4 | Eye | `public/models/eyeball.glb` | 2.1 MB | REVIEW | CLEAR or ATTRIB | Keep material quality high; current iris/eyeball readability matters. |
| 5 | Kidneys | `public/models/kidneys.glb` | 2.1 MB | REVIEW | CLEAR or ATTRIB | Needs paired organ framing and urinary-system context. |
| 6 | Liver | `public/models/liver.glb` | 2.5 MB | REVIEW | CLEAR or ATTRIB | Useful for digestion/metabolism branch bridge. |
| 7 | Intestine | `public/models/intestine.glb` | 1.9 MB | REVIEW | CLEAR or ATTRIB | Must retain recognizable coils and fit camera bounds. |
| 8 | Pancreas | `public/models/pancreas.glb` | 4.6 MB | REVIEW | CLEAR or ATTRIB | Lower kid recognition; still needed for digestion/endocrine content. |
| 9 | Skin | `public/models/skin.glb` | 5.5 MB | REVIEW | CLEAR or ATTRIB | Prefer a layered/cross-section model, not a generic skin patch. |

## Candidate Source Policy

Acceptable:

- paid marketplace purchase with clear commercial redistribution terms for web apps;
- CC0, public-domain, or CC BY assets where the exact asset page is recorded;
- university/museum/public-health assets only when the specific licence permits commercial use;
- custom authored GLBs when the model can match the current anatomy quality bar.

Rejected unless separately negotiated:

- non-commercial licences;
- no-derivatives licences when we need optimization/material edits;
- "free download" without licence text;
- marketplace assets with AI/provenance uncertainty;
- source pages that forbid redistribution inside an app bundle.

## Candidate Source Notes

Checked on 2026-08-12:

| Source | Licence / terms found | Decision | Reason |
| --- | --- | --- | --- |
| [NIH 3D 3DPX-020966, Heart Female](https://3d.nih.gov/entries/3DPX-020966/1.01) | CC BY 4.0 | Candidate for Heart | Exact HRA heart candidate found. Page records creator HRA, version 1.01, and attribution instructions. Input metadata lists `VH_F_Heart.glb` / `hra-reference-organ-heart-female-v1.2.glb` at 1.7 MB with 43,560 vertices. Direct S3 fetch returned XML access response during CLI review, so download/import still needs browser/API retrieval and visual QA before replacing `public/models/heart.glb`. |
| [Z-Anatomy / Models-of-human-anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) | CC BY-SA 4.0, with BodyParts3D attribution chain | Hold | Quality appears close to the anatomy bar, but ShareAlike obligations need a product/legal decision before importing into a proprietary app bundle. |
| [BodyParts3D / Anatomography](https://en.wikipedia.org/wiki/Anatomography) | CC BY-SA 2.1 Japan | Hold | Useful anatomy source, but ShareAlike is a product-level licensing decision, not a simple asset drop-in. |
| [NIH 3D](https://3d.nih.gov/) | Per-entry licences vary | Case-by-case | Only usable when the exact entry page is recorded and the licence is CC0/CC BY or otherwise commercial-safe. |
| [Sketchfab anatomy assets](https://sketchfab.com/search?features=downloadable&q=human%20heart&type=models) | Per-asset licences vary; many are marketplace or attribution assets | Case-by-case | Only acceptable with exact asset URL, licence, author, download artifact, and attribution text captured. |
| AI/model mirror sites | Often vague source and provenance | Reject by default | Do not use unless the original creator/source and licence chain are independently verifiable. |

## Completion Definition

P0 anatomy licensing is complete when:

- all nine organ rows in `docs/ASSET-LICENSES.md` are `CLEAR` or `ATTRIB`;
- all nine corresponding `modelRegistry.ts` records have exact `sourceName`, `sourceUrl`,
  `license`, `licenseStatus`, and attribution notes;
- `npm run assets:check` has zero warnings;
- `PAID_RELEASE=1 npm run assets:check` passes;
- desktop and mobile screenshots confirm each imported/replaced organ is centered, visible, and
  not clipped by canvas chrome.
