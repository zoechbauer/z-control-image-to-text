# Mobile Deployment Fixed

## 1. Capacitor 8 & Android Gradle Plugin (AGP) Compatibility

- **Problem:** "Incompatible version (AGP 8.13.0)"
    On starting Android Studio, i got this error: "The project is using an incompatible version (AGP 8.13.0) of the Android Gradle plugin. Latest supported version is AGP 8.10.1"

- **Solution:**
  - Set com.android.tools.build:gradle to 8.10.1 in android/build.gradle.
  - Set distributionUrl to Gradle 8.11.1 in gradle-wrapper.properties.
  - Sync & build

    ```bash
    npx cap sync android
    cd android
    ./gradlew wrapper --gradle-version 8.11.1
    ./gradlew clean
    ./gradlew assembleDebug
    ```

## 2. Error: invalid source release: 21

- **Problem:** Running ionic cap run android --external -l throws "error: invalid source release: 21" due to AGP 8.13.0 incompatibility.

- **Solution:** Downgrade to Java 17 in android/build.gradle.
    Add this to the end of android/build.gradle:

    ```gradle
    // Force Java 17 for all subprojects (including generated ones)
    subprojects {
        afterEvaluate { project ->
            if (project.hasProperty("android")) {
                project.android.compileOptions.sourceCompatibility = JavaVersion.VERSION_17
                project.android.compileOptions.targetCompatibility = JavaVersion.VERSION_17
            }
        }
    }
    ```

## 3. Android device cannot reach the local dev server

- **Problem:** The app is installed on the phone, but a white page is displayed with:
  `Webseite nicht verfügbar` / `ERR_CONNECTION_ABORTED`
  while trying to load `http://10.0.0.68:8100`.

- **Root cause:** The Android WebView is loading the Angular dev server from the notebook. The phone was not connected to the same Wi‑Fi network as the notebook, so it could not reach the PC on port 8100.

- **What fixed it:** Re-enabling Wi‑Fi on the mobile device. Once the phone was back on the same LAN, the live dev server became reachable again.

- **Why it happened:** The command `ionic cap run android --external -l any` starts a dev server and expects the phone and the development machine to share the same local network.

### Quick checklist

1. Make sure the phone and notebook are on the same Wi‑Fi network.
2. Confirm the dev server is running on port 8100.
3. Test the URL in the phone browser:
   ```text
   http://<your-pc-ip>:8100
   ```
4. If the url fails on the phone, the app will fail too.
5. Turn off VPNs and proxy tools that can break local network access.
6. Allow port 8100 in Windows Firewall.
7. For USB-connected devices, use:
   ```powershell
   adb reverse tcp:8100 tcp:8100
   ```
8. If the device is on mobile data only, the LAN-based live dev server will not work.

### Copy-paste commands

```powershell
ipconfig
```

```powershell
ionic cap run android --external -l any
```

```powershell
adb reverse tcp:8100 tcp:8100
```

```powershell
New-NetFirewallRule -DisplayName "Ionic Dev Port 8100" -Direction Inbound -Protocol TCP -LocalPort 8100 -Action Allow
```

```powershell
netstat -ano | findstr :8100
```

```powershell
npx ng serve --host=0.0.0.0 --port=8100
```

### Rule of thumb

- Same Wi‑Fi + same LAN + port 8100 open = works
- Wi‑Fi off / mobile data only = fails
- USB reverse tunnel = good fallback
- Android Studio APK install = useful when live server debugging is unreliable

This issue was a local network problem, not a Capacitor or Angular app bug.
