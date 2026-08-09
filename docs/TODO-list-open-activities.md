# TODO — Open activities

This document lists open tasks and follow-ups for the z-control Image To Text project. Use it to coordinate work, keep priorities visible, and track completion.

## Open tasks (closed items are marked with [x])

- [x] Deploy the app to Firebase Hosting and verify the web build.
- [x] Deploy the app to the Google Play Store internal test track.
- [x] Test the app on Samsung Galaxy A33 and A55 devices after installing from Google Play.
- [x] Create a privacy policy that clearly explains how user data is handled and protected.
- [x] Optionally enter a title and description in PhotoInfoModalComponent and save extracted text, title, and description with the photo to the device.
- [x] Allow editing photo metadata (title and description) from the history list and persist changes to device storage.
- [x] Refactor feature.component.html using a new template to reduce code duplication and improve maintainability.
- [x] Implement delete functionality for individual photos and their associated data in the history list.
- [x] Fix translation issues: remove hardcoded strings and update incorrect keys (QR code app) to match the z-control Ionic setup's translation structure and prefixes.
- [x] Added confirmation modals for deleting individual photos and all photos, with clear warnings about the irreversibility of these actions.
- [x] Store and display creation timestamps for extracted text and photo metadata, and last-modified timestamps for photo metadata.
- [x] Added a "next" and "previous" button to the FeatureComponent to allow users to navigate through the history of saved photos and their extracted text, improving usability and workflow efficiency.
- [x] Add copy-to-clipboard action for extracted text, photo, and statistics to improve workflow. At the moment, only PNG images can be copied to the clipboard due to platform limitations. On native platforms, only PNG and JPEG images can be copied to the clipboard. The app will notify users if they attempt to copy an unsupported image format.
- [x] Refactor and clean up code where appropriate.
- [ ] Update Online Help to document the app's features.
- [ ] Compress photos before saving to reduce storage usage.
- [ ] Add a search feature to search for photos by title, description, or extracted text in the history of saved photos.
- [ ] Add unit tests for new services and components.
- [ ] Update README.md to document the full project structure.
