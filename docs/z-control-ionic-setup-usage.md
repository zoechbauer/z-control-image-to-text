# z-control-ionic-setup

A reusable Ionic + Angular starter template for z-control apps, featuring a prebuilt settings page with all standard accordions and configuration patterns.

---

## Purpose

This project provides a consistent, ready-to-use foundation for all z-control apps. It includes:

- A settings page with all standard accordions used in previous apps
- Preconfigured scripts, Capacitor integration, and best practices
- Documentation and baseline configuration for rapid, reliable new app creation
- Native Android source files, icons, and configuration assets that are part of the starter setup

---

## How to Use for a New App

Suppose you want to create a new app called `z-control-image-to-text`:

### 1. Clone the Starter

```bash
git clone https://github.com/zoechbauer/z-control-ionic-setup.git z-control-image-to-text
cd z-control-image-to-text
```

### 2. Remove Old Git History

```bash
rm -rf .git
```

### 3. Initialize a New Git Repository

```bash
git init
git add .
git commit -m "chore: initial commit for z-control-image-to-text"
```

### 4. Update Project Metadata

- Change the project name in `package.json` and `capacitor.config.ts` to `z-control-image-to-text`.
- Update the app name, app ID, and branding as needed.
- Adjust the README and documentation to match the new app’s purpose.

### 5. Update Android Configuration

Before building the Android app, update the native Android files that are part of the starter template.

If the app installs but does not open, analyze the startup crash in **Android Studio Logcat**. Search for `FATAL EXCEPTION`, `Caused by:`, or your package name to find the real error.

| Path | Values to change |
|---|---|
| `android/app/build.gradle` | `applicationId` and `namespace` |
| `android/app/src/main/res/values/strings.xml` | `app_name` and, if needed, `title_activity_main` |
| `android/app/src/main/java/at/zcontrol/zoe/ionic_setup/MainActivity.java` | package name and folder structure |

### 6. Create a New GitHub Repository

- Create a new repo on GitHub (for example, `z-control-image-to-text`).
- Add it as the remote and push:

```bash
git remote add origin https://github.com/zoechbauer/z-control-image-to-text.git
git push -u origin master   # or main, depending on your branch
```

### 7. Start Development

```bash
npm install
npm start
```

## Summary

1. Clone the template repo to a new folder.
2. Remove the old `.git` directory.
3. Initialize a new Git repository and make the first commit.
4. Update all project names and settings.
5. Push to a new GitHub repository.
6. Start development for the new app.

---

This process ensures every new z-control app starts with your preferred settings page, structure, native Android configuration, and best practices.