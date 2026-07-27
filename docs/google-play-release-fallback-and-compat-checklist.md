# Google Play Release: OCR Fallback Logic and Compatibility Checklist

## Goal

Prevent hard crashes in the OCR flow when the native image plugin fails on some Play-delivered installs, while keeping image compression quality and behavior stable.

---

## 1) Exact Fallback Logic (Native First, Web Fallback)

### Why

Your OCR flow currently goes through:

- FeatureComponent.extractTextFromPhoto
- ImageCompressionService.buildVisionOcrRequestFromPhoto
- ImageCompressionService.compress
- ImageCompressionService.compressNative
- ImageManipulator.getDimensions

If the native plugin throws runtime errors such as NoClassDefFoundError or ClassNotFoundException, the whole OCR flow fails. The safest mitigation is:

- Try native path first on device
- If native plugin fails with known plugin/runtime errors, automatically fallback to web compression path
- Only rethrow unknown errors

### Exact patch for ImageCompressionService

File: src/app/services/image-compression.service.ts

```typescript
async compress(
  input: ImageCompressionInput,
  options: ImageCompressionOptions = {},
): Promise<ImageCompressionResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    mimeType = 'image/jpeg',
    forceResize = false,
  } = options;

  const { main, webview } = this.filePathService.resolveImageSource(input);
  const safeSource = webview || main;

  const originalBytes = await this.filePathService.getSourceBytes(safeSource);
  const { width: srcW, height: srcH } =
    await this.filePathService.getDimensions(safeSource);

  const pixels = srcW * srcH;
  const effQuality = pixels > 12_000_000 ? Math.min(quality, 0.75) : quality;
  const shouldResize = forceResize || srcW > maxWidth || srcH > maxHeight;

  const resizeOptions = {
    maxWidth,
    maxHeight,
    quality: effQuality,
    mimeType,
    shouldResize,
    originalBytes,
  };

  if (!Capacitor.isNativePlatform()) {
    return this.compressWeb(safeSource, resizeOptions);
  }

  try {
    return await this.compressNative(main, resizeOptions);
  } catch (error) {
    if (!this.isNativeImageManipulatorFailure(error)) {
      throw error;
    }

    console.warn(
      '[ImageCompressionService] Native compression failed, fallback to web compression',
      error,
    );

    return this.compressWeb(safeSource, resizeOptions);
  }
}

private isNativeImageManipulatorFailure(error: unknown): boolean {
  const message = String((error as any)?.message ?? '').toLowerCase();
  const stack = String((error as any)?.stack ?? '').toLowerCase();
  const payload = `${message} ${stack}`;

  const markers = [
    'noclassdeffounderror',
    'classnotfoundexception',
    'image manipulator',
    'imagemanipulator',
    'getdimensions',
    'plugin not implemented',
    'plugin unavailable',
  ];

  return markers.some((m) => payload.includes(m));
}
```

### Optional hardening (recommended)

1. Add a lightweight telemetry event when fallback is used, so you can measure affected devices.
2. Keep the existing FeatureComponent try/catch unchanged initially.
3. If both native and web paths fail, your current error toast remains correct.

---

## 2) Minimal Gradle and Plugin Compatibility Checklist

Use this checklist before each Play upload.

### A. Version alignment

1. Keep Capacitor packages on the same major and preferably same patch:
   - @capacitor/core
   - @capacitor/android
   - @capacitor/cli
2. Keep @capacitor-community/image-manipulator on the same major line as Capacitor.
3. Avoid mixed plugin generations (for example old v5 or v6 plugins in v8 app).

### B. Sync and clean build

1. Run dependency install from lockfile.
2. Run Capacitor sync after dependency updates.
3. Build release from a clean Android state.

Suggested command sequence:

```powershell
npm ci
npx cap sync android
Set-Location android
.\gradlew clean bundleRelease
```

### C. Verify plugin wiring in generated Android config

1. Confirm plugin include exists in android/capacitor.settings.gradle.
2. Confirm dependency exists in android/app/capacitor.build.gradle.
3. Confirm release plugin manifest contains ImageManipulatorPlugin:
   - android/app/build/intermediates/assets/release/mergeReleaseAssets/capacitor.plugins.json

Expected classpath value:

```text
com.ryltsov.alex.plugins.image.manipulator.ImageManipulatorPlugin
```

### D. Verify class presence in the actual shipped artifact

Important: debug APK success does not prove Play-delivered split APK success.

1. Build the same AAB you upload.
2. Generate installable APK set from that AAB with bundletool.
3. Install on target failing device model.
4. Validate OCR flow on device.
5. If crash persists, inspect installed APK classes for:
   - com.ryltsov.alex.plugins.image.manipulator.ImageDimensions

If class is missing in delivered artifact, treat as packaging/distribution incompatibility, not OCR API failure.

### E. Gradle and Java compatibility baseline

1. App and plugin compile with same Java target (currently Java 21 in your project).
2. Keep minSdk, compileSdk, targetSdk consistent across app and plugin modules.
3. During diagnosis, keep release minify disabled to reduce variables.
4. If minify is re-enabled later, add keep rules for plugin classes.

Example keep rules when minify is enabled:

```proguard
-keep class com.ryltsov.alex.plugins.image.manipulator.** { *; }
-keep class com.getcapacitor.** { *; }
```

---

## 3) Release Gate (Quick Pass/Fail)

Pass release only if all are true:

1. Native path works on at least one low-end device and one modern device.
2. Fallback path works when native plugin is forced to fail (test build hook or temporary throw).
3. Play internal track install on known problematic device can complete OCR without crash.
4. No fatal exception in CapacitorPlugins thread during OCR action.

If any item fails, block production rollout and keep rollout in internal or closed test track.

---

## 4) Rollout Strategy

1. Ship fallback logic first with no other major changes.
2. Use staged rollout in Play (for example 5 percent to 20 percent to 100 percent).
3. Monitor crash-free users and stack traces for ImageManipulator related failures.
4. If failures remain device-specific, pin or fork plugin and replace Java record type with standard class model for compatibility testing.
