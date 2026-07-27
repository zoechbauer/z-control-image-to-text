# TODO — Open activities

This document lists open tasks and follow-ups for the z-control Image To Text project. Use it to coordinate work, keep priorities visible, and track completion.

## Open tasks (closed items are marked with [x])

- [x] Deploy the app to Firebase Hosting and verify the web build.
- [x] Deploy the app to the Google Play Store internal test track.
- [x] Test the app on Samsung Galaxy A33 and A55 devices after installing from Google Play.
- [ ] Create a privacy policy that clearly explains how user data is handled and protected.
- [ ] Require a title and description in PhotoInfoModalComponent before saving photos to the device.
- [ ] Limit the visible history list to a single photo (scrollable) so action buttons remain visible.
- [ ] Implement confirmDeleteAllPhotos() and confirmDeletePhoto() in PhotoService to show a confirmation modal before deleting photos.
- [ ] Allow editing photo metadata (title and description) from the history list and persist changes to device storage.
- [ ] Add copy-to-clipboard actions for extracted text, compressed photos, and statistics to improve workflow.
- [ ] Fix translation issues: remove hardcoded strings and update incorrect keys (QR code app) to match the z-control Ionic setup's translation structure and prefixes.
- [ ] Auto-rotate photos before extracting text and before saving them to the device.
- [ ] Update Online Help to document the app's features.
- [ ] Add unit tests for new services and components.
- [ ] Enable stricter lint rules in the configuration and fix remaining lint issues.
- [ ] Refactor and clean up code where appropriate.
- [ ] Update README.md to document the full project structure.
