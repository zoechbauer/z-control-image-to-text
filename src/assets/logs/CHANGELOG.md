# What's New?

Welcome to the latest updates for the **z-control Image to Text** app.

## Versioning

This project uses a simplified major.minor versioning scheme:

- Major versions indicate significant milestones or breaking changes.
- Minor versions indicate new features, improvements, and bug fixes.
- Patch numbers are intentionally omitted; all changes are released as major or minor versions.

## [0.5] – 2026-06-20

### ✨ New Features

- Added FileUtilsService to manage file operations (save/read photos and files), with unit tests for FILESYSTEM.
- Added PhotoService to capture, select, normalize and prepare images for processing.
- Added PhotoInfoModalComponent for viewing and editing photo metadata and user input.
- Added AlertService to handle confirming user actions like deleting photos.

### 🚀 Improvements

- Updated translation keys and UI copy for clarity and consistency (renamed translation prefix TRANSLATE → FEATURE).
- Refactored FirebaseFirestoreService to use the updated translation keys for error messages and consistent handling.

### 🐛 Fixes

- Added missing translations; fixed typos and prefix inconsistencies across localization files.

### 🔧 Internal

- Upgraded Java to 21 and Gradle to 9.2.0 to support @angular/camera and newer Android camera APIs.
- Refactored app.config.ts: separated Firebase provider wiring into functions for better organization and maintainability.

## [0.4] – 2026-06-13

### 🚀 Improvements

- Refactor FeatureComponent to present a clear, step-by-step workflow with context-aware action buttons that guide users through each stage.
- Add toast notifications for simulation actions to provide immediate, contextual user feedback.
- Update translations and UI copy to match the new workflow step labels and improve clarity.
- Improved Typescript configuration by adding an exclude array, preventing unnecessary type checking and improving build performance.
- Improved Tools/Readme.md documentation for clarity and better guidance on using the backup and environment generation scripts.

## [0.3] - 2026-06-11

### 🔧 Internal

- Renamed FeatureExampleComponent to FeatureComponent to better reflect its purpose in the app. We use a generic name for the component to allow for future expansion of features without needing to rename it again.

## [0.2] - 2026-06-11

### ✨ New Features

- Added support for the new Firestore collection `ZC_image_to_text_statistics` to store quota usage data for the Test feature.
- Successfully installed the app on an Android test device to verify the updated Android configuration.
- Verified the app on both Android and Web, confirming that the new Firestore collection stores Test feature quota usage correctly.
- All unit tests passed successfully, confirming that the app is functioning as expected with the new Firestore collection and updated configurations.

### 🔧 Internal

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
