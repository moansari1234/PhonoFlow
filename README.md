# PhonoFlow

PhonoFlow is a premium, offline-capable accent training and phonological mastery laboratory. It guides users through targeted minimal pair drills, speech shadowing, and acoustic pitch contour exercises to help acquire and master the General American accent.

## Features

- **Diagnostic Baseline**: AI-guided assessment to identify primary phonological shifts based on your L1 background.
- **Minimal Pair Drills**: High-contrast minimal pair testing to develop auditory discrimination.
- **Rhythm & Intonation**: Stress-timing metronomes and pitch contour visualizers.
- **Actionable Analytics**: Deep breakdowns of your mastery across different articulatory groups.
- **Privacy First**: All acoustic practice data is saved directly in your browser's local storage.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Android APK Generation (CI/CD)

This repository includes an automated GitHub Actions runner (`.github/workflows/android-release.yml`) that dynamically compiles the React web application into an Android APK using Capacitor, signs it, and attaches it directly to the GitHub Releases page.

### How to trigger a new APK Release

1. **Tag a Release**: Push a new tag starting with `v` (e.g., `v1.0.0`) to your repository.
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. **Manual Trigger**: Go to the "Actions" tab in your GitHub repository, select the "Android APK Build and Release" workflow, and click "Run workflow".

### APK Signing Requirements

For the automated runner to successfully sign the APK, you must configure the following **Repository Secrets** in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

- `ANDROID_SIGNING_KEY`: The base64-encoded string of your `.jks` or `.keystore` file. 
  *(To generate this from your keystore: `base64 -w 0 my-release-key.jks`)*
- `ANDROID_KEY_ALIAS`: The alias you used when generating the keystore.
- `ANDROID_KEYSTORE_PASSWORD`: The password for your keystore.
- `ANDROID_KEY_PASSWORD`: The password for the specific key alias.

The workflow will automatically use your GitHub Run ID as the `versionCode` and the tag name as the `versionName`.
