# z-control IONIC Setup

The z-control IONIC Setup app is a starter template and utility for building Ionic applications within the z-control ecosystem. It provides a structured foundation with built-in features like quota management, tab-based navigation, and comprehensive documentation to help developers quickly create and deploy their own Ionic apps.

## Features

- **Quota management**: Track and display API usage with clear quota limits and warnings
- **Tab-based navigation**: Clean, intuitive UI with separate tabs for main feature and settings
- **Built-in help**: Help page for step-by-step instructions and FAQs
- **Structure for Settings**: Dedicated settings tab with accordions for configuration, Feedback, Change-log, Privacy Policy, and support

Download now for free and use it to create your own Ionic apps!

## Download & Online Access
**Web Application**

Explore the z-control Ionic Setup application online via Firebase Hosting:

👉 https://z-control-ionic-setup.web.app/

The online demo uses the free Datamuse API, allowing you to test quota management and application features without setting up your own backend environment.

**Android Application**

The Android app is **available only to the z-control team in Google Play Internal Test Group** for testing and validation purposes, as it is used to create new applications based on this setup. It is not intended for public distribution.

👉 https://play.google.com/store/apps/details?id=at.zcontrol.zoe.ionicsetup

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

## 📁 Project Structure

```
z-control-ionic-setup/
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

## Development Workflow

Use this workflow when you build a new feature for another z-control app (for example translator) that needs backend changes.

1. Implement backend changes in [z-control Backend Functions](https://github.com/zoechbauer/z-control-backend-functions) repository and deploy them from there.
2. Start Firebase emulators from z-control Backend Functions repository.
3. Run this target frontend app with `ionic serve`.
4. Test FE and BE integration against the Firebase emulator.
5. Deploy shared Firebase Functions from the z-control Backend Functions repository only.
6. Deploy the target frontend app after integration tests pass.

Why this works:

- Shared backend stays in one source of truth.
- Function deployments remain safe and predictable.
- Frontend repos can evolve independently without backend deployment ownership.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Ionic CLI](https://ionicframework.com/docs/cli)
- [Angular CLI](https://angular.io/cli)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

### Installation

```bash
git clone https://github.com/zoechbauer/z-control-ionic-setup
cd z-control-ionic-setup
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

- [How to use this setup app](docs/z-control-ionic-setup-usage.md)
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
