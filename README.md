# z-control Image to Text

Make a photo or load an image from your device, and the app will extract the text from the image using Optical Character Recognition (OCR) technology. The extracted text together with an entered title and description can be copied or saved to your device. The app also provides statistics about the extracted text, including word count, line count, and character count.

The app uses the Google Cloud Vision API for OCR. It is built with Ionic 8 and Angular 20, and it can be run as a web app or installed on Android devices.

Google Cloud Vision API usage is limited to 1,000 requests per month for free, shared across all users of the app. The app will display a warning when the quota is close to being reached.

This app was created with the **z-control IONIC Setup** app (https://github.com/zoechbauer/z-control-ionic-setup), which is a starter template and utility for building Ionic applications within the z-control ecosystem. It provides a structured foundation with built-in features like quota management, tab-based navigation, and comprehensive documentation to help developers quickly create and deploy their own Ionic apps.

## Features

- **Quota management**: Track and display API usage with clear quota limits and warnings
- **Shared monthly quota**: Free tier with 1,000 requests for text recognition per month shared across all users
- **Tab-based navigation**: Clean, intuitive UI with separate tabs for main feature and settings (Text Recognition)
- **Step-by-step workflow**: Guided process from image selection to text extraction, sharing, and history management
- **Built-in help**: Help page for step-by-step instructions and FAQs
- **Structure for Settings**: Dedicated settings tab with accordions for configuration, Feedback, Change-log, Privacy Policy, and support

Download now for free and use it to create your own Ionic apps!

## Download & Online Access

- **Web App:**  
  [Run the app online (Firebase Hosting)](https://z-control-image-to-text.web.app/)

- **Native Mobile App on Android devices:**
  [Get the app on Google Play Store](https://play.google.com/store/apps/details?id=at.zcontrol.zoe.image_to_text) — currently available through closed testing.

---

## 🛠️ Tech Stack

- **Framework**: Ionic 8 with Angular 20
- **Language**: TypeScript
- **Styling**: SCSS with Ionic CSS Variables
- **Build Tool**: Angular CLI
- **Icons**: Ionicons
- **State Management**: RxJS (BehaviorSubject, Subject)
- **Backend**: Firebase (Firestore, Cloud Functions, Hosting) managed by [z-control Backend Functions](https://github.com/zoechbauer/z-control-backend-functions) repository
- **Testing**: Karma + Jasmine (frontend), Vitest (backend)
- **Deployment**: Capacitor (Android) for Frontend
- **OCR Service**: Google Cloud Vision API for text recognition
- **Image Compression**: ImageManipulator (native) and pica (web) for resizing and compressing images before sending to OCR

## 📁 Project Structure

```text
z-control-image-to-text/
├── src/                         # Angular/Ionic frontend source
│   ├── app/                     # Pages, components, services, shared code
│   ├── assets/                  # Static assets, logs, language files
│   ├── environments/            # Environment configuration
│   └── theme/                   # Global theme variables
├── docs/                        # Project and architecture documentation
│   └── unit-tests/              # Testing tutorials and quick references
├── tools/                       # Utility scripts and templates
├── resources/                   # App icons, splash screens, platform resources
├── www/                         # Built web output (hosting target)
├── angular.json                 # Angular workspace config
├── capacitor.config.ts          # Capacitor app config
├── firebase.json                # Firebase hosting/functions config
└── package.json                 # Frontend scripts and dependencies

```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Ionic CLI](https://ionicframework.com/docs/cli)
- [Angular CLI](https://angular.io/cli)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

### Installation

```bash
git clone https://github.com/zoechbauer/z-control-image-to-text.git
cd z-control-image-to-text
npm install
ionic serve
```

The app will open at `http://localhost:4200/` in your browser.

### Testing

#### Frontend Tests (Karma + Jasmine)

```bash
# Run unit tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with code coverage
npm run test:coverage
```
#### Backend Tests (Vitest + Istanbul)

See [z-control Backend Functions](https://github.com/zoechbauer/z-control-backend-functions) repository documentation for backend testing instructions, as the backend code and tests are maintained there.

### Building for Android

```bash
ionic build --prod
npx cap sync android
cd android
./gradlew buildRelease
```

## Documentation

- [TODO List](docs/TODO-list-open-activities.md)
- [Docs index](docs/README.md)

## Tools

This project includes utility scripts in the `tools/` folder for backing up non-committed files and generating environment files from `.env.local`. See [tools/README.md](tools/README.md) for details on how to use these scripts.

## Privacy Policy

This setup app does not collect or store any personal data. It is designed to be a local utility for developers to build their own Ionic apps.

Settings and usage data are stored locally on the user's device and are not transmitted to any servers. The app does not use any third-party analytics or tracking services.

## License

[MIT](LICENSE)

## Contact & Support

For questions, feedback, or support:  
[z-control Support & Feedback](https://z-control-4070.web.app/home)

Email: [zcontrol.app.qr@gmail.com](mailto:zcontrol.app.qr@gmail.com)

---

## Version History

See [CHANGELOG.md](src/assets/logs/CHANGELOG.md) for detailed release notes and version history.
