# Plain names for GROUND_DETAIL

## Context
The flat `GROUND_DETAIL` keys (`octaves`, `grainPeriods`, `fadeStart`, ...) were hard to read and tune. They are now grouped by the three things you see in walk mode, so the group name carries the meaning. Pure rename, no behaviour change.

## Groups
- `mesh`: the square sheet of triangles that follows the walker.
- `hills`: real bumps added to the sheet's heights. They shrink to flat towards the sheet's edge so it meets the tile around it.
- `roughness`: the bump texture that fakes fine bumps with light only.

## Renames
| Old | New |
|---|---|
| `patchMetres` | `mesh.widthMetres` |
| `patchSegments` | `mesh.squaresPerSide` |
| `rebuildMetres` | `mesh.rebuildAfterWalkingMetres` |
| `rebuildToleranceMetres` | `mesh.rebuildIfGroundShiftsMetres` |
| `fadeStart` / `fadeEnd` | `hills.flattenFrom` / `hills.flattenUntil` |
| `octaves` | `hills.sizes` |
| `wavelengthMetres` / `amplitudeMetres` | `widthMetres` / `heightMetres` |
| `bumpScale` | `roughness.strength` |
| `grainTileMetres` | `roughness.repeatsEveryMetres` |
| `grainTextureSize` | `roughness.pixels` |
| `grainPeriods` | `roughness.bumpsPerRepeat` |
| `grainSecondScale` | `roughness.bigPatchesScale` |
| `grainSecondWeight` | `roughness.bigPatchesStrength` |
| `grainAnchorKm` | `roughness.realignAfterKm` |

## Not renamed
Function, variable and shader names (`edgeFade`, `grainUv`, `secondGrainOffset`, ...) keep their names.

## Verification
`tests/tests.html`: all tests pass. Walk mode looks the same as before the rename.
