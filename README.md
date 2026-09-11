# PhonoFlow

> Accent training and phonological mastery laboratory for General American pronunciation.

[![Download Latest APK](https://img.shields.io/badge/Download-Android%20APK-059669?style=for-the-badge&logo=android&logoColor=white)](releases/latest)

---

## Overview

PhonoFlow is an offline-capable accent training platform designed to build phonological awareness and auditory discrimination. It guides learners through targeted minimal pair drills, speech shadowing, and acoustic pitch contour exercises.

## Key Features

- **Diagnostic Baseline**: Initial phonological assessment to identify target shifts based on your L1 background.
- **Minimal Pair Drills**: High-contrast minimal pairs with real-time auditory discrimination practice.
- **Pitch & Intonation Contours**: Visual pitch curves and stress-timing metronomes.
- **Articulatory Analytics**: Deep breakdowns of mastery across vowel formants, consonant voicing, and phoneme pairs.
- **Privacy First**: Local-first data architecture ensures all practice recordings and metrics remain on your device.

## Download App

- 📱 **[Download Latest Android APK](releases/latest)**
- 📦 **[View All Releases](releases)**

## Getting Started

### Prerequisites
- Node.js 22+
- npm

### Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production web build
npm run build
```

## Creating an Android Release

Builds are generated automatically using the included GitHub Actions workflow:

1. **Tag a Release**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. **Manual Build**: Go to **Actions** → **Android APK Build and Release** → **Run workflow**.
