# Camera / Capacitor Camera Migration Guide

## Goal

Document a safe, low-risk plan to migrate away from deprecated Camera.getPhoto and deprecated plugin types (Photo, CameraResultType, CameraSource) to the non-deprecated Camera APIs (takePhoto / chooseFromGallery) and an app-owned photo shape for this repository.

## Background

- The current codebase imports and uses types and APIs from @capacitor/camera: Camera.getPhoto, Photo, CameraResultType and CameraSource. These plugin APIs and exported types are now marked deprecated by the plugin maintainers and TypeScript (S1874 warnings).
- Relying on deprecated plugin types (Photo, CameraResultType, CameraSource) keeps the app coupled to an API surface that may change or be removed. The plugin's newer APIs (takePhoto, chooseFromGallery) can also return different result shapes (MediaResult / MediaResults) that do not match the old Photo shape.
- A full migration touches many files and may introduce type and runtime mismatches (MediaResult vs Photo). Postponing a big-bang migration is reasonable; this document describes a recommended approach and a minimal adapter scaffold for safe, incremental migration.

## Key guidance (explicit replacements)

- Replace Camera.getPhoto(...) calls with either Camera.takePhoto(...) (camera capture) or Camera.chooseFromGallery(...) (gallery selection). Prefer using adapter methods instead of calling plugin APIs directly from many places.
- Stop importing or depending on the plugin-exported Photo, CameraResultType, and CameraSource types in application code. Instead:
  - Introduce a small app-owned type (CapturedPhoto) that describes the fields the app needs (webPath, path, format, saved).
  - Normalize plugin raw results (MediaResult / MediaResults / CameraPhoto variants) to CapturedPhoto inside the adapter.
- Update PhotoStorageService and other photo-handling code to accept CapturedPhoto instead of plugin Photo where practical. This decouples storage logic from plugin shape changes.

## References

- Ionic Camera (legacy) docs: https://ionicframework.com/docs/v8/native/camera
- Capacitor Camera plugin docs (look up current installed version): https://capacitorjs.com/docs/apis/camera

## Recommended strategy (high level)

1. Create a single adapter that centralizes calls to the Camera plugin and normalizes results into a small, stable app-level shape (CapturedPhoto).
2. Replace direct calls to Camera.getPhoto and any use of CameraResultType/CameraSource/Photo in the codebase with calls to the adapter and the CapturedPhoto type. Do this in small, reviewable commits.
3. Run tests and build; fix issues iteratively. Keep the adapter as the only place that knows raw plugin shapes such as MediaResult or MediaResults.
4. Once everything is stabilized, remove deprecated imports/usages from the codebase and update docs/CHANGELOG.

## Why use an adapter?

- Minimizes churn: only one file needs to handle plugin API differences and deprecated types.
- Easier to test and mock in unit tests (adapter can be provided/mocked).
- The adapter isolates type normalization so application code uses a stable CapturedPhoto type instead of plugin types that may be deprecated or removed.

## Suggested app-level type

Use a very small shape that contains the properties the app requires. This is the single canonical type the app depends on instead of plugin Photo.

```ts
// src/app/shared/camera.types.ts
export type CapturedPhoto = {
  webPath?: string | null; // URI usable in an <img>
  path?: string | null; // filesystem path on native
  format?: string | null; // 'jpeg' | 'png' | ... guessed from extension if missing
  saved?: boolean; // whether the adapter/storage saved this photo to filesystem
  // keep extensible to avoid breaking when plugin adds fields
  [key: string]: any;
};
```

Notes:

- Using CapturedPhoto avoids using the deprecated Photo type from the plugin and avoids TypeScript S1874 warnings.
- Keep the shape minimal — only include fields needed by PhotoStorageService and the UI.

## Adapter scaffold (recommended)

Create a small injectable service that encapsulates Camera usage and returns CapturedPhoto. The adapter should NOT export or re-export deprecated plugin types. Keep options typed as `any` or define a narrow interface if you want strict typing tied to a specific plugin version.

```ts
// src/app/services/camera-adapter.service.ts
import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera'; // do not import deprecated plugin types in app code
import type { CapturedPhoto } from '../shared/camera.types';

@Injectable({ providedIn: 'root' })
export class CameraAdapterService {
  async takePicture(): Promise<CapturedPhoto> {
    // use takePhoto for camera capture; avoid Camera.getPhoto
    const raw = await (Camera as any).takePhoto({ resultType: 'uri', quality: 90 } as any);
    return this.normalize(raw);
  }

  async pickFromGallery(): Promise<CapturedPhoto> {
    const raw = await (Camera as any).chooseFromGallery({ resultType: 'uri', quality: 90 } as any);
    return this.normalize(raw);
  }

  private normalize(raw: any): CapturedPhoto {
    // plugin versions vary: handle MediaResult / MediaResults / CameraPhoto / array shapes
    const candidate = Array.isArray(raw) ? raw[0] : raw?.media?.[0] ?? raw;

    const guessFormat = (p?: string | null) => {
      if (!p) return 'jpeg';
      const m = p.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      if (!m) return 'jpeg';
      const ext = m[1].toLowerCase();
      return ext === 'jpg' ? 'jpeg' : ext;
    };

    return {
      webPath: candidate?.webPath ?? candidate?.path ?? null,
      path: candidate?.path ?? null,
      format: candidate?.format ?? guessFormat(candidate?.webPath ?? candidate?.path ?? null),
      saved: typeof candidate?.saved === 'boolean' ? candidate.saved : false,
      ...candidate,
    };
  }
}
```

Important adapter notes:

- The adapter intentionally avoids importing plugin-exported types like Photo, CameraResultType or CameraSource so the app does not reintroduce deprecation warnings.
- The adapter centralizes any special-case handling for web vs native result shapes.

## Practical replacements (example changes to your code)

Update occurrences similar to the following in these files:

- src/app/services/photo.service.ts (currently uses Camera.getPhoto and CameraSource)
  - Replace makePhoto/selectPhoto/capturePhoto implementations to call cameraAdapter.takePicture() and cameraAdapter.pickFromGallery() instead of Camera.getPhoto({ source: CameraSource.* }).
  - Change methods that accept or return plugin Photo to use CapturedPhoto. For example, `private async saveCapturedPhoto(capturedPhoto: Photo)` → `private async saveCapturedPhoto(capturedPhoto: CapturedPhoto)` and `public async savePhoto(photo: Photo)` → `public async savePhoto(photo: CapturedPhoto)`.

- src/app/services/photo-storage.service.ts (currently imports Photo from @capacitor/camera)
  - Replace `import { Photo } from '@capacitor/camera'` with `import type { CapturedPhoto } from '../shared/camera.types'` and update method signatures that use Photo to use CapturedPhoto.
  - Ensure readAsBase64 and savePhoto handle the potential absence of `format`/`path`/`webPath` by using guards and the adapter's normalized shape.

Example (photo.service.ts before → after):

Before:

```ts
const capturedPhoto = await Camera.getPhoto({ resultType: CameraResultType.Uri, source: CameraSource.Camera });
await this.saveCapturedPhoto(capturedPhoto);
```

After:

```ts
const capturedPhoto = await cameraAdapter.takePicture();
await this.saveCapturedPhoto(capturedPhoto);
```

And adjust the types for saveCapturedPhoto/savePhoto to accept CapturedPhoto.

## Migration steps (detailed)

1. Add the adapter service file as above.
2. Change callers to use the adapter instead of Camera.getPhoto or direct Camera calls. Replace CameraSource-based branching by calling the appropriate adapter method (takePicture vs pickFromGallery).
3. Update PhotoStorageService.savePhoto and any other photo-handling functions to accept the CapturedPhoto shape (or keep existing Photo plugin type but ensure adapter returns a compatible shape). Replace any `import { Photo } from '@capacitor/camera'` with the app type.
4. Run `npm run build` and `npm test`, fix type errors.
5. Remove deprecated imports/usages (Camera.getPhoto, CameraPhoto, CameraResultType, CameraSource) once all callers use adapter.
6. Update README/CHANGELOG explaining the adapter and how to replace it if plugin API changes again.

## Testing and validation

- Run unit tests (npm test) and CI pipelines after changes.
- Manual smoke test on devices/emulators to validate camera and gallery flows.

## Commands & quick checks

- Build: npm run build
- Tests: npm test
- Use VS Code search to locate remaining usages of deprecated API and plugin types:
  - `@capacitor/camera` (imports)
  - `Camera.getPhoto` (deprecated call sites)
  - `CameraPhoto` / `Photo` (deprecated types)
  - `CameraResultType` / `CameraSource` (deprecated enums)

Example PowerShell search suggested previously (run from repo root):

```powershell
Get-ChildItem -Path . -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.html | Select-String -Pattern "Camera\.getPhoto|CameraPhoto|from '@capacitor/camera'" | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
```

## Rollback / small-scope migration

- If a migration introduces regressions, revert the single commit that replaced callers with adapter calls. The adapter commit is small and low-risk to revert.

## Notes

- Options typing: takePhoto/chooseFromGallery may accept different options shapes depending on @capacitor/camera version. The adapter used `as any` for those calls to accept minor typing differences; for strict typing, align the options with the installed plugin version.
- The adapter approach allows you to keep using a stable app-owned CapturedPhoto type across the app and perform any plugin-specific normalization in a single place.

## When to perform the migration

- Schedule the migration as part of a sprint/maintenance window when you can run device tests.
- Prefer doing it before a Capacitor/core or plugin major upgrade that might remove deprecated APIs entirely.

## Help

If you want, the following can be provided next:

- A finished adapter file committed to a feature branch and a single caller replaced as proof-of-concept.
- Run the test/build locally and resolve type/test failures caused by the adapter replacement.

Prepared by: Copilot (AI assistant using Copilot SDK in VS Code)
