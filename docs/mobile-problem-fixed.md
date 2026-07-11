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
