# What's New?

Welcome to the latest updates for the **z-control Image to Text** app.

## Versioning

This project uses a simplified major.minor versioning scheme:

- Major versions indicate significant milestones or breaking changes.
- Minor versions indicate new features, improvements, and bug fixes.
- Patch numbers are intentionally omitted; all changes are released as major or minor versions.

## What's Coming Next

- Add copy-to-clipboard support for a photo's extracted text, compressed image, and metadata.
- Update the Online Help to document History, metadata editing, and related workflows.
- Limit the visible history list to a single photo (scrollable) so action buttons remain visible.
- Store and display creation and last-modified timestamps for photos and extracted text metadata.
- Add a search feature to find saved photos by title, description, or extracted text.
- Add unit tests for the new services and components.
- Apply automatic rotation to photos before text extraction and saving to ensure correct orientation.

## [1.3] – 2026-08-02

### ✨ New Features

- Added ability to delete individual photos and their associated data from the History list.
- Added confirmation dialogs for deleting a single photo or all photos, including clear warnings that the action is irreversible.

### 🚀 Improvements

- Hid the "Delete all data" button in the History workflow when there are no saved photos.
- Disabled action buttons while an operation is in progress to prevent duplicate submissions.
- Showed a notification when the user cancels photo selection or capture to provide immediate feedback.
- Replaced hardcoded UI strings with translation keys and updated translation prefixes to match the z-control Ionic Setup.
- Clarified the label for the "back" button in the History workflow and updated translations to match its purpose.

## [1.2] – 2026-07-31

### ✨ New Features

- Added a History workflow step to view, edit, copy, and delete previously extracted text and photos, giving users an organized way to manage past results.
- Introduced the PhotoInfoModalComponent to capture and edit photo metadata (title and description) before saving, improving organization and searchability.
- Show the photo's title and description beneath the image for a quick metadata preview without opening the modal.

### 🚀 Improvements

- Redesigned PhotoInfoComponent: the photo now appears below the title and description inputs, and the modal header includes save and cancel icons for clearer navigation.
- On mobile, hide the photo while editing metadata to maximize space for input fields and reduce visual clutter.
- Update the app title to "Manage History" when viewing or editing saved extractions to provide clearer context.
- Removed the Save button from `WorkflowStep.DISPLAY_EXTRACTED_TEXT`; extracted text and the photo are now saved automatically.
- Added FeatureResultComponent to present extracted text, the photo, and metadata in a clearer, more maintainable layout.

### 🐛 Fixes

- Added the missing translation key for `UserstatisticsComponent` to resolve a localization issue.

### 🔧 Internal

- Added docs/checklist-update-objects.md: guidance for safely updating nested objects in Angular/TypeScript, covering immutability, merging strategies, and unit-testing best practices to avoid data loss or race conditions.

## [1.1] – 2026-07-28

### 🚀 Improvements

- Replaced the Ionic Setup privacy policy with an app-specific Privacy Policy that clearly explains data handling and user rights, and added a link to the full policy on the Landing page for easy access.
- Improved toast reliability in production builds by ensuring ion-toast is registered before ToastController usage and preloading registration during service initialization.

### 🐛 Fixes

- Fixed a production-only issue where toast notifications did not appear on web and mobile builds while working in ionic serve/dev mode.

### 🔧 Internal

- Added and stabilized unit tests for toast service safeguard paths, including component registration flow, controller failure logging, and timeout logging behavior.
- Verified full test suite passes (545 green tests).

## [1.0] – 2026-07-27

### ✨ New Features

- **Created a prototype for OCR (Optical Character Recognition) feature to convert images to text.**
- Added @capacitor-community/image-manipulator for native image compression and resizing.
- Added pica library for high-quality image resizing in web environments.
- Implemented several services to implement image compression and text extraction.
- Display extracted text and statistics (word count, line count, character count) in the UI after processing an image.
- Added the documentation for the Image to Text feature, including technical details, architecture, and cost considerations.
- **Hosted the app on Firebase Hosting** for testing and demonstration purposes, allowing users to access the app via a web browser.
- **Published a test build on Google Play** for demonstration and device testing, enabling z-control to install the app on Android devices. The app was successfully validated on Samsung Galaxy A33 and Galaxy A55 devices.

### 🚀 Improvements

- Improved the displayed information when no image is selected, providing clearer guidance to the user.
- Replaced the FileUtilsService with
  - the new PhotoStorageService to manage photo persistence, loading, caching, deletion, and storage permissions,
  - the new FileConversionService to handle Blob/base64/data URL conversion logic,
  - the new FilePathService to handle path resolution, filename generation, image loading, dimensions, byte-size estimation, and canvas conversion
    to better separate concerns and improve maintainability.
- Splitted interfaces for image compression and Google Vision API into separate files for better organization and maintainability.
- Improved method names in FeatureComponent to better reflect their purpose and functionality, enhancing code readability and maintainability.
- Added function descriptions to the FeatureComponent methods to provide clear explanations of their purpose, parameters, and return values, improving code documentation and developer understanding.
- Updated the help text in the GetHelpComponent to provide clearer guidance and instructions for users, improving user experience and reducing confusion.
- Used better icons for the buttons in the FeatureComponent to improve visual clarity and user experience.
- Changed workflow step: email feature was replaced by copy-to-clipboard feature for extracted text, compressed photo, and statistics to simplify the workflow and improve usability.
- Updated the README.md and documentation to reflect the new features, architecture, and workflow changes.

### 🐛 Fixes

- Fixed unit tests for the app changes, ensuring that they pass successfully and validate the expected behavior of the app.
- Fixed max-line-length lint errors in unit-test descriptions to improve readability and adhere to coding standards.

### 🔧 Internal

- Added linting rules for TypeScript files to enforce code quality and consistency.
- Added lint:watch script to package.json to enable continuous linting during development, improving code quality and catching issues early.

## [0.4] – 2026-07-20

### ✨ New Features

- **Created a prototype for capturing or selecting photos, saving them to the file system and local storage, and loading and displaying photo history.**
- Added FileUtilsService to manage file operations (save/read photos and files), with unit tests for FILESYSTEM.
- Added PhotoService to capture, select, normalize and prepare images for processing.
- Added PhotoInfoModalComponent for viewing and editing photo metadata and user input.
- Added AlertService to handle confirming user actions like deleting photos.

### 🚀 Improvements

- Updated translation keys and UI copy for clarity and consistency (renamed translation prefix TRANSLATE → FEATURE).
- Refactored FirebaseFirestoreService to use the updated translation keys for error messages and consistent handling.

### 🐛 Fixes

- Added missing translations; fixed typos and prefix inconsistencies across localization files.
- Fixed the translation keys for alertService, which was copied from z-control QR Code app (key structure changed in z-control Ionic Setup).

### 🔧 Internal

- Upgraded Java to 21 and Gradle to 9.2.0 to support @angular/camera and newer Android camera APIs.
- Refactored app.config.ts: separated Firebase provider wiring into functions for better organization and maintainability.
- Added function descriptions to the methods in services to provide clear explanations of their purpose, parameters, and return values, improving code documentation and developer understanding.

## [0.3] – 2026-06-13

### 🚀 Improvements

- Refactor FeatureComponent to present a clear, step-by-step workflow with context-aware action buttons that guide users through each stage.
- Add toast notifications for simulation actions to provide immediate, contextual user feedback.
- Update translations and UI copy to match the new workflow step labels and improve clarity.
- Improved Typescript configuration by adding an exclude array, preventing unnecessary type checking and improving build performance.
- Improved Tools/Readme.md documentation for clarity and better guidance on using the backup and environment generation scripts.

## [0.2] - 2026-06-11

### ✨ New Features

- **Successfully installed the app on an Android test device to verify the updated Android configuration.**
- Added support for the new Firestore collection `ZC_image_to_text_statistics` to store quota usage data for the Test feature.
- Verified the app on both Android and Web, confirming that the new Firestore collection stores Test feature quota usage correctly.
- All unit tests passed successfully, confirming that the app is functioning as expected with the new Firestore collection and updated configurations.

### 🔧 Internal

- Updated the app name and ID in `capacitor.config.ts` to `z-control Image to Text` and `at.zcontrol.zoe.image_to_text`.
- Updated the project name in `package.json`, `package-lock.json` and `.env.local` to `z-control-image-to-text`.
- Renamed the Firestore collection and the app ID in `AppConstants` for this app to `ZC_image_to_text_statistics` and `image_to_text` to keep data isolated from other apps.
- Renamed the translation of "Main Feature" to "Text Recognition" in all languages to match the app’s purpose.
- Defined the new collection name in the backend of `z-control-ionic-setup` and deployed the changes to Firebase.
- Updated the appId in the `firebase-firestore.service.spec.ts` and `feature.service.spec.ts` test files to `image_to_text` to match the new app ID
- Renamed FeatureExampleComponent to `FeatureComponent` to better reflect its purpose in the app. We use a generic name for the component to allow for future expansion of features without needing to rename it again.

## [0.1] – 2026-06-10

### 🔧 Internal

- **Initial release of the Image to Text app based on the z-control Ionic Setup project.**
- Cleared git history and changelog to start fresh for the new app.
- Added .env.local file to the project to store environment variables for local development, ensuring sensitive information is not committed to version control.
- Successfully started app with ionic serve.

### 🛡 Security

- Your data stays on your device and is not shared with third parties.
- Only the used features send data to the backend for processing.
