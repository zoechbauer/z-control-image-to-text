# Upgrade Gradle from 8.11.1 to 9.2.0

## Summary

Java 21 is now supported in Gradle 9.2, and Gradle 8.11.1 is the last version to support Java 17. If you are using Java 21, you must upgrade to Gradle 9.2.

## Upgrade Steps

1. Update the Gradle wrapper to version 9.2.0 by running the following command in your project directory:

   ```bash
   ./gradlew wrapper --gradle-version 9.2.0
   ```

This will update distributionUrl to the correct Gradle distribution for that version.

Old version Android/gradle/wrapper/gradle-wrapper.properties:

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

new version Android/gradle/wrapper/gradle-wrapper.properties:

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-9.2.0-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

Why changes might appear ignored

Android Studio/IDE might be configured to use a local Gradle installation instead of the wrapper. In Android Studio: File → Settings → Build, Execution, Deployment → Gradle → set “Use Gradle from” → “Gradle wrapper”.

Running Gradle from outside the android folder (or launching a build from a node_modules plugin folder) will not read the root wrapper settings and can show a different Gradle version.

CI or scripts may overwrite the file. Search your repo for commands that run gradle wrapper or write the file.

## Verification Upgrade

To verify that the Gradle wrapper has been upgraded correctly, run the following command:

```bash
./gradlew --version
```

You should see output indicating that Gradle 9.2.0 is being used.

## Clean Android Project

After upgrading Gradle, it is recommended to clean your Android project to ensure that all build artifacts are regenerated:

```bash
./gradlew clean
```

Stop Gradle daemons, remove local build caches and any local .gradle folder, remove old wrapper dists, then force re-download

```powershell
# go to android folder
cd android

# stop daemons
.\gradlew.bat --stop

# remove project caches and build outputs
Remove-Item -Recurse -Force .gradle
Remove-Item -Recurse -Force build
Remove-Item -Recurse -Force app\build

# remove specific old wrapper distribution(s) from Gradle user home
$gw = "$env:USERPROFILE\.gradle\wrapper\dists"
Get-ChildItem $gw | Where-Object { $_.Name -match '8\.11\.1' } | ForEach-Object { Remove-Item -Recurse -Force $_.FullName }

# confirm wrapper is set to 9.2.0 (or update it)
.\gradlew.bat wrapper --gradle-version 9.2.0 --distribution-type bin

# verify active Gradle version
.\gradlew.bat --version
```

Notes

- The wrapper distributions are normally under %USERPROFILE%.gradle\wrapper\dists (not inside the project). Remove the matching gradle-<version>-bin folder(s) there to force re-download.
- Deleting .gradle and build is safe — they are caches/artifacts and will be recreated.
- After cleaning run gradlew.bat --version to confirm Gradle 9.2.0 is active and then gradlew.bat clean assembleDebug to rebuild.
- If Android Studio still shows an older version, ensure it’s configured to use the Gradle wrapper (File → Settings → Build Tools → Gradle → Use Gradle wrapper).
