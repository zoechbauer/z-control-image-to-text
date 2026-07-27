# Permission Test Checklist

**Purpose**

Verify saving/reading images to a public folder so files survive uninstall and work across Android versions/OEMs.

**Files to reference**

- `src/app/services/photo-storage.service.ts`
- `android/app/src/main/AndroidManifest.xml`

## Prioritized Test Matrix

| Priority | Device / Android API                   | Primary checks                                                                    | Expected result                                                                                                     | Notes                                             |
| -------: | -------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
|        1 | API 36 (Android 14) — Pixel / stock    | Save image to Pictures/z-control, open in Gallery, uninstall/reinstall, read back | File appears in Gallery and survives uninstall; app can read after reinstall (request runtime permission if needed) | Primary target (compile/target SDK = 36)          |
|        2 | API 33 (Android 13) — Pixel / stock    | Save; read (request `READ_MEDIA_IMAGES` at runtime); revoke permission and retry  | Save works; reading requires runtime `READ_MEDIA_IMAGES`; revocation handled gracefully                             | Verify permission dialog text and UX              |
|        3 | API 30 (Android 11)                    | Save via `Directory.External` fallback; open in Files/Gallery                     | MediaStore/External write works with scoped storage; files visible                                                  | Test both Files app and Gallery                   |
|        4 | API 29 (Android 10)                    | Save/read behavior with scoped-storage transitional rules                         | May require legacy handling on some devices; note differences                                                       |                                                   |
|        5 | API 24 (Android 7.0)                   | Runtime permission prompts (`READ/WRITE_EXTERNAL_STORAGE`), save/read             | Classic storage permissions model; grant flow works                                                                 | Lowest supported API (minSdk=24)                  |
|        6 | OEM variants (Samsung, Xiaomi, Huawei) | Permission dialog behavior, aggressive power/permission managers                  | OEM quirks may require extra user instructions                                                                      | Prioritize one Samsung + one Xiaomi/Huawei device |

## Per-device Test Steps

1. Install debug (or release when applicable) build.
2. Open app; attempt to save an image via the public-save flow.
3. Observe runtime permission prompt:
   - If shown, allow and continue.
   - If denied, confirm app shows a user-facing error and instructions to enable the permission in Settings.
4. Verify saved file:
   - Open Gallery → Pictures → z-control (or Files app → Pictures/z-control).
   - Confirm image displays and file metadata looks correct.
5. Restart app and re-open the saved image from the app UI to ensure reading works.
6. Uninstall app → Reinstall → Confirm saved images remain accessible.
7. Permission edge cases:
   - Deny permission → verify graceful error + Settings guidance.
   - Deny + "Don't ask again" → ensure app shows steps to enable in Settings.
   - Revoke permission from Settings while app installed → verify app handles missing permission.
8. Scoped storage checks:
   - If write fails, log device + Android version + error; try MediaStore insertion (native) as a fallback.
9. SD / external storage (optional): if device has an SD card, test saving/selecting SD as a target if exposed.

## Acceptance Criteria (Pass Conditions)

- Saving an image to `Pictures/z-control` succeeds and the file is visible in Gallery/Files.
- Saved files survive app uninstall/reinstall.
- App requests the correct runtime permission per API:
  - API ≥ 33: `READ_MEDIA_IMAGES` for reads.
  - API 24–32: `READ_EXTERNAL_STORAGE` (and `WRITE_EXTERNAL_STORAGE` where applicable).
- App handles permission denial gracefully and instructs the user how to enable permission in Settings.
- Test results are documented per device (pass/fail + notes).

## Helpful adb commands

Install / uninstall:

```bash
adb install -r path/to/app-debug.apk
adb uninstall at.zcontrol.zoe.image_to_text
```

Grant / revoke runtime permission (debuggable apps):

```bash
adb shell pm grant at.zcontrol.zoe.image_to_text android.permission.READ_MEDIA_IMAGES
adb shell pm revoke at.zcontrol.zoe.image_to_text android.permission.READ_MEDIA_IMAGES
```

List saved files:

```bash
adb shell ls -l /sdcard/Pictures/z-control
```

Check permission state:

```bash
adb shell dumpsys package at.zcontrol.zoe.image_to_text | grep permission -A 5
```

## Notes & Next Actions

- If any device shows writes blocked for `Directory.External`, implement a MediaStore-based native Capacitor plugin (insert with `RELATIVE_PATH = Environment.DIRECTORY_PICTURES + "/z-control"`).
- After testing, collect a short matrix (Device, API, Build, Save Pass/Fail, Read Pass/Fail, Notes). I can generate a CSV or Markdown table template for that report if you want.
