# What's New?

Welcome to the latest updates for the **z-control Image to Text** app.

## Versioning

This project uses a simplified major.minor versioning scheme:

- Major versions indicate significant milestones or breaking changes.
- Minor versions indicate new features, improvements, and bug fixes.
- Patch numbers are intentionally omitted; all changes are released as major or minor versions.

## [0.3] - 2026-06-11

### 🚀 Internal

- Renamed FeatureExampleComponent to FeatureComponent to better reflect its purpose in the app. We use a generic name for the component to allow for future expansion of features without needing to rename it again.

## [0.2] - 2026-06-11

### ✨ New Features

- Added support for the new Firestore collection `ZC_image_to_text_statistics` to store quota usage data for the Test feature.
- Successfully installed the app on an Android test device to verify the updated Android configuration.
- Verified the app on both Android and Web, confirming that the new Firestore collection stores Test feature quota usage correctly.
- All unit tests passed successfully, confirming that the app is functioning as expected with the new Firestore collection and updated configurations.

### 🚀 Internal

- Updated the app name and ID in `capacitor.config.ts` to `z-control Image to Text` and `at.zcontrol.zoe.image_to_text`.
- Updated the project name in `package.json`, `package-lock.json` and `.env.local` to `z-control-image-to-text`.
- Renamed the Firestore collection and the app ID in `AppConstants` for this app to `ZC_image_to_text_statistics` and `image_to_text` to keep data isolated from other apps.
- Renamed the translation of "Main Feature" to "Text Recognition" in all languages to match the app’s purpose.
- Defined the new collection name in the backend of `z-control-ionic-setup` and deployed the changes to Firebase.
- Updated the appId in the `firebase-firestore.service.spec.ts` and `feature.service.spec.ts` test files to `image_to_text` to match the new app ID

## [0.1] – 2026-06-10

### 🔧 Internal

- Initial release of the Image to Text app based on the z-control Ionic Setup project.
- Cleared git history and changelog to start fresh for the new app.
- Added .env.local file to the project to store environment variables for local development, ensuring sensitive information is not committed to version control.
- Successfully started app with ionic serve.

### 🛡 Security

- Your data stays on your device and is not shared with third parties.
- Only the used features send data to the backend for processing.
