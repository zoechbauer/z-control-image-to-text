# Documentation Overview: z-control IONIC Setup App

The [docs](.) folder contains categorized guides, troubleshooting steps, and best practices for developing, building, and deploying the z-control IONIC Setup App using Ionic, Angular, and Capacitor.

## A. Programming

- **todo-list-environment-programmer-devices.md**  
  Checklist for updating environment variables and programmer device UIDs, including required steps for Firestore user mapping updates.

- **coding-guidelines.md**  
  Clean code principles and best practices for naming, functions, error handling, formatting, and testing.

  **why-use-runInInjectionContext.md**  
  Explanation of the importance of using `runInInjectionContext` in Angular for proper dependency injection and change detection in asynchronous or external code.

- **standalone-config.md**  
  Guide to using Angular's standalone components and ApplicationConfig for centralized provider management without NgModules.

### Unit Testing

Guides for setting up, running, and improving Angular unit tests with Karma and Jasmine, including practical fixes and learning resources.

- **karma-test-runner-scrolling-fix.md**  
  Fixes a Karma runner issue where Jasmine results can be cut off by Ionic global styles. Includes the dedicated `test-runner.scss` override for the test context.

- **unit-testing-tutorials.md**  
  Curated tutorials and resources for learning Angular unit testing with Karma and Jasmine, from setup basics to best practices.

- **jasmine-vs-vitest.md**  
  Compares Jasmine and Vitest for Angular projects, including features, performance, ecosystem, and when to choose each option.

- **unit-testing-learning-roadmap.md**  
  A structured roadmap for mastering Angular unit testing, with recommended docs, courses, and hands-on practice steps.

- **unit-testing-quick-reference.md**  
  A compact command reference for running and troubleshooting Angular unit tests with Karma and Jasmine.

## B. Installation

- **mobile-installation-guide.md.md**  
  Instructions for installing the app locally on Android devices, including prerequisites, APK building, and troubleshooting installation problems.

## C. Troubleshooting

- **mobile-problem-fixed.md**  
  Documents resolved issues, such as the accordion toggle error and Gradle/Kotlin compatibility fixes for stable mobile deployment.

- **solving-installation-problems-android.md**  
  Troubleshooting guide for the "requestAccordionToggle is not a function" error in production builds, with solutions for build optimization and dependency updates.

- **clean-android-build-step-by-step.md**  
  Detailed guide for performing a clean Android build, including cleaning artifacts, syncing assets, and rebuilding in Android Studio.

## D. Google Firebase API

- **firebase-config-enviroment-files.md**  
  Instructions for managing Firebase configuration using environment files to keep credentials out of source control. Includes local setup, usage, and security notes.

- **fe-be-regression-checklist.md**  
  Release checklist for validating frontend/backend integration between setup and translator flows, including emulator startup, callable success, Firestore updates, appId contract checks, and deployment safety.

- **firebase-functions-esm-build-guide.md**  
  Step-by-step guide for building Firebase Functions with ESM, native fetch, and strict type isolation in a monorepo. Includes troubleshooting for TypeScript and module issues.

- **local-testing-guide-secureTranslate.md**  
  How to test the SecureTranslate Cloud Function locally using the Firebase Emulator Suite and dotenv for environment variables. Includes curl examples, debugging, and troubleshooting steps.

## E. Google Play Store Publication ([docs](upload-to-google-playstore/docs) folder)

- **upload-to-google-playstore/docs/Google-Play-Store-Publication-Guide.md**  
  Complete step-by-step guide for publishing to Google Play Store, covering 24 steps across 6 phases from app creation through post-launch management. Includes build instructions, testing workflows, submission checklists, and troubleshooting.

  <i>Note: This document contains information from the **z-control Translator app** publication process that is used as a reference for the setup app. The setup app is used for creating new apps that will be deployed on Google Play and will follow a similar publication workflow, but with its own specific details and assets.</i>

- **upload-to-google-playstore/docs/Update-Notification-Guide.md**  
  Guide to app update notifications covering closed testing and production releases. Explains how to monitor test updates, how users get notified of new versions, automatic vs. manual updates, and optional in-app update strategies.

- **upload-to-google-playstore/docs/ionic-capacitor-splash-screens-guide.md**  
  Guide to creating and implementing app icons and splash screens for Android using @capacitor/assets or manual drawable generation. Includes image specifications, tools, and troubleshooting tips.

---

### How to Use This Folder

- **Programming:** Start here for code quality, upgrade, and UI asset generation guides.
- **Installation:** Use the installation guide for setting up the app on Android devices.
- **Troubleshooting:** Refer to these documents for resolving build, runtime, and deployment issues.
- **Google Firebase API:** Use the Firebase config guide to manage environment-specific settings securely.
- **Google Play Store Publication:** Use these guides for creating app assets (icons, splash screens) and the complete publication workflow.

Each document is self-contained and addresses a specific aspect of the app's development or deployment. For further details, open the relevant markdown file in this folder.
